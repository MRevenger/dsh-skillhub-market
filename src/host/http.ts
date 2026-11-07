/** Small unified HTTP layer for the Skillhub host routes. */

/** Error with a stable code and HTTP status for route responses. */
export class HttpError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code = 'REQUEST_FAILED', status = 502) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.status = status
  }
}

/** Read a response body while enforcing a byte cap. */
async function readLimited(response: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError('响应内容过大', 'RESPONSE_TOO_LARGE')
  }
  if (response.body === null) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value === undefined) continue
      total += value.byteLength
      if (total > maxBytes) {
        throw new HttpError('响应内容过大', 'RESPONSE_TOO_LARGE')
      }
      chunks.push(value)
    }
  } finally {
    try { await reader.cancel() } catch { /* already closed */ }
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), total)
}

/** Fetch JSON with a timeout, non-2xx rejection and `code !== 0` rejection. */
export async function fetchJson(url: string, options: { timeoutMs?: number; maxBytes?: number } = {}): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? 15_000
  const maxBytes = options.maxBytes ?? 8 * 1024 * 1024
  let response: Response
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new HttpError('请求 Skillhub 超时，请稍后重试', 'TIMEOUT', 504)
    }
    throw new HttpError(`无法连接 Skillhub：${error instanceof Error ? error.message : String(error)}`, 'NETWORK_ERROR')
  }
  const text = (await readLimited(response, maxBytes)).toString('utf8')
  if (!response.ok) {
    let detail = ''
    try {
      const body = JSON.parse(text) as { message?: unknown; error?: unknown; code?: unknown }
      detail = typeof body.message === 'string' ? body.message : typeof body.error === 'string' ? body.error : ''
    } catch { /* non-json error body */ }
    throw new HttpError(detail !== '' ? detail : `Skillhub 返回 HTTP ${response.status}`, 'HTTP_ERROR', response.status >= 500 ? 502 : response.status)
  }
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new HttpError('Skillhub 返回了无效的 JSON', 'INVALID_JSON')
  }
  if (payload !== null && typeof payload === 'object') {
    const code = (payload as { code?: unknown }).code
    if (typeof code === 'number' && code !== 0) {
      const message = (payload as { message?: unknown }).message
      throw new HttpError(typeof message === 'string' ? message : `Skillhub 返回错误码 ${code}`, 'SKILLHUB_CODE', 502)
    }
  }
  return payload
}

/** Download a ZIP with a timeout and byte cap. */
export async function fetchZip(url: string, options: { timeoutMs?: number; maxBytes?: number } = {}): Promise<Buffer> {
  const timeoutMs = options.timeoutMs ?? 120_000
  const maxBytes = options.maxBytes ?? 32 * 1024 * 1024
  let response: Response
  try {
    response = await fetch(url, {
      headers: { accept: 'application/zip, application/octet-stream' },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new HttpError('下载技能包超时，请稍后重试', 'TIMEOUT', 504)
    }
    throw new HttpError(`下载技能包失败：${error instanceof Error ? error.message : String(error)}`, 'NETWORK_ERROR')
  }
  if (!response.ok) {
    let detail = ''
    try { detail = (await response.text()).slice(0, 300).trim() } catch { /* ignore */ }
    throw new HttpError(detail !== '' ? detail : `下载技能包失败：HTTP ${response.status}`, 'DOWNLOAD_HTTP', response.status === 404 ? 404 : 502)
  }
  const bytes = await readLimited(response, maxBytes)
  if (bytes.byteLength < 4 || bytes.readUInt32LE(0) !== 0x04034b50) {
    throw new HttpError('下载内容不是有效的 ZIP 文件', 'INVALID_ZIP')
  }
  return bytes
}
