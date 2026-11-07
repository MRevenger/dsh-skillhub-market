/** Authenticated host routes consumed by the browser panel. */
import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  ApiKeyFilter,
  SkillQuery,
  SortKey,
  SourceKey,
} from '../shared/types.ts'
import { FALLBACK_CATEGORIES } from './api-map.ts'
import { HttpError } from './http.ts'
import { installSkill, InstallError } from './install.ts'
import { getCategories, getSkillDetail, listSkills } from './skillhub.ts'
import {
  assertSafeDirName,
  getInstalledDetail,
  readCustomMeta,
  saveCustomEntry,
  scanInstalled,
  skillsRoot,
} from './store.ts'
import { ZipError } from './zip.ts'

/** Stable route prefix shared with the browser client. */
export const API_PREFIX = '/api/skillhub-market'

/** A mounted route descriptor. */
export interface RouteDefinition {
  path: string
  methods: string[]
  requestBody?: 'buffered'
  fetch: (request: Request) => Promise<Response>
}

/** Build a JSON response. */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

/** Map thrown errors to a useful JSON body. */
function errorResponse(error: unknown): Response {
  if (error instanceof InstallError) return json({ error: error.message, code: error.code }, error.status)
  if (error instanceof ZipError) return json({ error: error.message, code: error.code }, 400)
  if (error instanceof HttpError) return json({ error: error.message, code: error.code }, error.status)
  return json({ error: error instanceof Error ? error.message : String(error), code: 'INTERNAL_ERROR' }, 500)
}

/** Read a bounded JSON request body. */
async function readJsonBody(request: Request, limit = 64 * 1024): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > limit) throw new HttpError('请求体过大', 'BODY_TOO_LARGE', 413)
  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > limit) throw new HttpError('请求体过大', 'BODY_TOO_LARGE', 413)
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new HttpError('请求体不是有效 JSON', 'INVALID_BODY', 400)
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError('请求体应为对象', 'INVALID_BODY', 400)
  }
  return parsed as Record<string, unknown>
}

/** Read an optional string field. */
function stringField(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key]
  return typeof value === 'string' ? value : undefined
}

/** Read URL search params into a validated market query. */
export function parseSkillQuery(params: URLSearchParams): SkillQuery {
  const sort = params.get('sort')
  const source = params.get('source')
  const apiKey = params.get('apiKey')
  const allowedSorts: SortKey[] = ['all', 'trending', 'downloads', 'newest']
  const allowedSources: SourceKey[] = ['all', 'community', 'clawhub', 'enterprise']
  const allowedApiKeys: ApiKeyFilter[] = ['all', 'required', 'none']
  return {
    keyword: params.get('keyword') ?? '',
    page: Number(params.get('page') ?? '1'),
    pageSize: Number(params.get('pageSize') ?? '24'),
    sort: allowedSorts.includes(sort as SortKey) ? sort as SortKey : 'all',
    source: allowedSources.includes(source as SourceKey) ? source as SourceKey : 'all',
    category: params.get('category') ?? 'all',
    apiKey: allowedApiKeys.includes(apiKey as ApiKeyFilter) ? apiKey as ApiKeyFilter : 'all',
  }
}

/** Open a directory in the OS file manager without waiting for it. */
function openDirectory(path: string): Promise<void> {
  const command = process.platform === 'win32'
    ? 'explorer.exe'
    : process.platform === 'darwin'
      ? 'open'
      : 'xdg-open'
  return new Promise((resolve, reject) => {
    let settled = false
    const child = spawn(command, [path], { detached: true, stdio: 'ignore' })
    child.once('error', (error) => {
      if (settled) return
      settled = true
      reject(error)
    })
    child.once('spawn', () => {
      if (settled) return
      settled = true
      child.unref()
      resolve()
    })
  })
}

/** Build the route table bound to a home resolver. */
export function createRoutes(resolveHome: () => string): RouteDefinition[] {
  return [
    {
      path: `${API_PREFIX}/skills`,
      methods: ['GET'],
      fetch: async (request) => {
        try {
          const url = new URL(request.url, 'http://localhost')
          return json(await listSkills(parseSkillQuery(url.searchParams)))
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/categories`,
      methods: ['GET'],
      fetch: async () => {
        try {
          return json({ items: await getCategories() })
        } catch {
          // The client still needs a usable filter when the categories endpoint
          // is down; this fallback is copied from the live 13-item response.
          return json({ items: FALLBACK_CATEGORIES, fallback: true })
        }
      },
    },
    {
      path: `${API_PREFIX}/detail`,
      methods: ['GET'],
      fetch: async (request) => {
        try {
          const url = new URL(request.url, 'http://localhost')
          const slug = url.searchParams.get('slug') ?? ''
          const namespace = url.searchParams.get('namespace') ?? undefined
          return json(await getSkillDetail(slug, namespace))
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/install`,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        try {
          const body = await readJsonBody(request)
          const slug = stringField(body, 'slug') ?? ''
          if (slug.trim() === '') throw new HttpError('缺少技能 slug', 'INVALID_ARGUMENT', 400)
          const homepage = stringField(body, 'sourceHomepage')
          const result = await installSkill({
            dshHome: resolveHome(),
            slug,
            overwrite: body.overwrite === true,
            ...(homepage === undefined ? {} : { sourceHomepage: homepage }),
          })
          return json(result)
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/installed`,
      methods: ['GET'],
      fetch: async () => {
        try {
          return json(await scanInstalled(resolveHome()))
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/installed/detail`,
      methods: ['GET'],
      fetch: async (request) => {
        try {
          const url = new URL(request.url, 'http://localhost')
          const dir = url.searchParams.get('dir') ?? ''
          return json(await getInstalledDetail(resolveHome(), dir))
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/custom`,
      methods: ['GET'],
      fetch: async () => {
        try {
          const result = await readCustomMeta(resolveHome())
          return json(result)
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/custom`,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        try {
          const body = await readJsonBody(request)
          const slug = stringField(body, 'slug') ?? ''
          const displayName = stringField(body, 'displayName') ?? ''
          const note = stringField(body, 'note') ?? ''
          const safe = assertSafeDirName(slug)
          const home = resolveHome()
          const skillPath = join(skillsRoot(home), safe, 'SKILL.md')
          try {
            const info = await stat(skillPath)
            if (!info.isFile()) throw new Error('not a file')
          } catch {
            throw new HttpError('技能不存在或缺少 SKILL.md', 'NOT_FOUND', 404)
          }
          return json(await saveCustomEntry(home, { slug: safe, displayName, note }))
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/open-folder`,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        try {
          const body = await readJsonBody(request)
          const slug = stringField(body, 'dir') ?? ''
          const skill = await getInstalledDetail(resolveHome(), slug)
          await openDirectory(skill.path)
          return json({ ok: true, path: skill.path })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
    {
      path: `${API_PREFIX}/health`,
      methods: ['GET'],
      fetch: async () => json({ ok: true, dshHome: resolveHome() }),
    },
  ]
}
