/** Thin browser client for the authenticated host routes. */
import type {
  CategoryOption,
  CustomSkillMeta,
  InstallResult,
  InstalledListResult,
  InstalledSkill,
  RemoteSkill,
  SkillListResult,
  SkillQuery,
} from '../shared/types.ts'

/** An API failure carrying an HTTP status and a stable code. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

const BASE = 'api/skillhub-market'

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  timeoutMs?: number
  signal?: AbortSignal
}

/** Read a JSON error message from a failed response. */
async function readError(response: Response): Promise<ApiError> {
  let message = `HTTP ${response.status}`
  let code = 'HTTP_ERROR'
  try {
    const payload = await response.json() as { error?: unknown; message?: unknown; code?: unknown }
    if (typeof payload.error === 'string' && payload.error !== '') message = payload.error
    else if (typeof payload.message === 'string' && payload.message !== '') message = payload.message
    if (typeof payload.code === 'string') code = payload.code
  } catch { /* non-JSON error body */ }
  return new ApiError(message, code, response.status)
}

/** Request JSON from a host route. Paths are document-relative (no leading slash). */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 20_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const forwardAbort = (): void => controller.abort()
  options.signal?.addEventListener('abort', forwardAbort)
  try {
    const response = await fetch(path, {
      method: options.method ?? 'GET',
      headers: options.body === undefined ? undefined : { 'content-type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      credentials: 'same-origin',
    })
    if (!response.ok) throw await readError(response)
    const text = await response.text()
    if (text.trim() === '') return undefined as T
    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError('服务返回了无效的 JSON', 'INVALID_RESPONSE', response.status)
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted) {
      throw new ApiError(options.signal?.aborted === true ? '请求已取消' : '请求超时', 'TIMEOUT', 0)
    }
    throw new ApiError(error instanceof Error ? error.message : String(error), 'NETWORK_ERROR', 0)
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', forwardAbort)
  }
}

/** Market and local-skill operations exposed to components. */
export class SkillhubApi {
  /** Fetch one page of the market feed. */
  list(query: SkillQuery, signal?: AbortSignal): Promise<SkillListResult> {
    const params = new URLSearchParams({
      keyword: query.keyword,
      page: String(query.page),
      pageSize: String(query.pageSize),
      sort: query.sort,
      source: query.source,
      category: query.category,
      apiKey: query.apiKey,
    })
    return request<SkillListResult>(`${BASE}/skills?${params.toString()}`, { signal })
  }

  /** Fetch categories (the host falls back to a bundled list if needed). */
  categories(signal?: AbortSignal): Promise<{ items: CategoryOption[]; fallback?: boolean }> {
    return request<{ items: CategoryOption[]; fallback?: boolean }>(`${BASE}/categories`, { signal })
  }

  /** Fetch one skill's online detail. */
  detail(slug: string, namespace?: string, signal?: AbortSignal): Promise<RemoteSkill> {
    const params = new URLSearchParams({ slug })
    if (namespace !== undefined && namespace !== '') params.set('namespace', namespace)
    return request<RemoteSkill>(`${BASE}/detail?${params.toString()}`, { signal })
  }

  /** Download and install a skill. */
  install(slug: string, overwrite: boolean, sourceHomepage?: string): Promise<InstallResult> {
    return request<InstallResult>(`${BASE}/install`, {
      method: 'POST',
      body: {
        slug,
        overwrite,
        ...(sourceHomepage === undefined ? {} : { sourceHomepage }),
      },
      timeoutMs: 180_000,
    })
  }

  /** Scan local skills. */
  installed(signal?: AbortSignal): Promise<InstalledListResult> {
    return request<InstalledListResult>(`${BASE}/installed`, { signal })
  }

  /** Read one local skill including its Markdown body. */
  installedDetail(dir: string, signal?: AbortSignal): Promise<InstalledSkill> {
    return request<InstalledSkill>(`${BASE}/installed/detail?dir=${encodeURIComponent(dir)}`, { signal })
  }

  /** Read user metadata. */
  custom(signal?: AbortSignal): Promise<{ data: Record<string, CustomSkillMeta>; error?: string }> {
    return request<{ data: Record<string, CustomSkillMeta>; error?: string }>(`${BASE}/custom`, { signal })
  }

  /** Save a custom display name and note (never writes SKILL.md). */
  saveCustom(slug: string, displayName: string, note: string): Promise<CustomSkillMeta> {
    return request<CustomSkillMeta>(`${BASE}/custom`, {
      method: 'POST',
      body: { slug, displayName, note },
    })
  }

  /** Ask the host to reveal the installed folder in the OS file manager. */
  openFolder(dir: string): Promise<{ ok: boolean; path: string }> {
    return request<{ ok: boolean; path: string }>(`${BASE}/open-folder`, {
      method: 'POST',
      body: { dir },
    })
  }
}
