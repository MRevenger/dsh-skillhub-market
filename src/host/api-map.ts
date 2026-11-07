/**
 * Central Skillhub API mapping.
 *
 * Every endpoint, query parameter, sort alias and label mapping lives here so a
 * future API change is a one-file edit. Probed against the live API on
 * 2026-11-08: the list feed only accepts `updated_at/downloads/stars/installs/score`
 * for `sortBy`; `trending` returns HTTP 400, so the UI's "近期飙升" choice maps
 * to the feed's own trending proxy `score desc` (the official site does the same).
 */
import type {
  ApiKeyFilter,
  CategoryOption,
  FrontmatterValue,
  RemoteSkill,
  SkillListResult,
  SkillQuery,
  SortKey,
  SourceKey,
} from '../shared/types.ts'

/** Skillhub origin for API calls. */
export const SKILLHUB_API = 'https://api.skillhub.cn'
/** Public web origin used for detail links. */
export const SKILLHUB_WEB = 'https://skillhub.cn'

/** List/search endpoint. */
export const SKILLS_PATH = '/api/skills'
/** ZIP download endpoint. */
export const DOWNLOAD_PATH = '/api/v1/download'
/** Detail endpoint (append the encoded slug). */
export const DETAIL_PATH = '/api/v1/skills'
/** Live category enumeration. */
export const CATEGORIES_PATH = '/api/v1/categories'

/** The live API's accepted sort fields. `trending` is deliberately absent. */
export type ApiSortBy = 'score' | 'downloads' | 'updated_at' | 'stars' | 'installs'

/** One UI sort choice and the exact feed parameters it sends. */
export interface SortMapping {
  sortBy?: ApiSortBy
  order?: 'asc' | 'desc'
  /** Shown in the UI when the choice is a fallback rather than a native field. */
  fallbackNote?: boolean
}

/**
 * UI sort -> list-feed parameters.
 * - all: no sort params (the feed's default composite ordering)
 * - trending: no native `trending` field exists; use `score desc`
 * - downloads: native `downloads desc`
 * - newest: native `updated_at desc` (the feed's "newly listed/updated" field)
 */
export const SORT_MAP: Readonly<Record<SortKey, SortMapping>> = {
  all: {},
  trending: { sortBy: 'score', order: 'desc', fallbackNote: true },
  downloads: { sortBy: 'downloads', order: 'desc' },
  newest: { sortBy: 'updated_at', order: 'desc' },
}

/** Sort choices in display order. */
export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; labelKey: string }> = [
  { value: 'all', labelKey: 'sort.all' },
  { value: 'trending', labelKey: 'sort.trending' },
  { value: 'downloads', labelKey: 'sort.downloads' },
  { value: 'newest', labelKey: 'sort.newest' },
]

/**
 * Source choices. The feed accepts `source`; it is a listing feed rather than
 * a strict publisher filter (results can be mixed), which the UI explains.
 * `all` sends no parameter. `enterprise` is a real value returned by the feed.
 */
export const SOURCE_OPTIONS: ReadonlyArray<{ value: SourceKey; labelKey: string }> = [
  { value: 'all', labelKey: 'source.all' },
  { value: 'community', labelKey: 'source.community' },
  { value: 'clawhub', labelKey: 'source.clawhub' },
  { value: 'enterprise', labelKey: 'source.enterprise' },
]

/** API-key choices. */
export const API_KEY_OPTIONS: ReadonlyArray<{ value: ApiKeyFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'apiKey.all' },
  { value: 'required', labelKey: 'apiKey.required' },
  { value: 'none', labelKey: 'apiKey.none' },
]

/**
 * Fallback categories, copied from the live `/api/v1/categories` response.
 * The UI prefers the live endpoint; this list only keeps the filter usable
 * when that request fails.
 */
export const FALLBACK_CATEGORIES: ReadonlyArray<CategoryOption> = [
  { key: 'pay-skill', name: 'Pay Skill', nameEn: 'Pay Skill' },
  { key: 'office-efficiency', name: '办公效率', nameEn: 'Office Efficiency' },
  { key: 'content-creation', name: '内容创作', nameEn: 'Content Creation' },
  { key: 'dev-programming', name: '开发编程', nameEn: 'Developer Tools' },
  { key: 'data-analysis', name: '数据分析', nameEn: 'Data Analysis' },
  { key: 'design-media', name: '设计多媒体', nameEn: 'Design & Media' },
  { key: 'ai-agent', name: 'AI Agent', nameEn: 'AI Agent' },
  { key: 'knowledge-management', name: '知识管理', nameEn: 'Knowledge Management' },
  { key: 'business-ops', name: '商业运营', nameEn: 'Business Operations' },
  { key: 'education', name: '教育学习', nameEn: 'Education' },
  { key: 'professional', name: '行业专业', nameEn: 'Professional' },
  { key: 'it-ops-security', name: 'IT 运维与安全', nameEn: 'IT Ops & Security' },
  { key: 'life-service', name: '生活服务', nameEn: 'Life Services' },
]

/** Map a UI sort choice to feed parameters. */
export function sortParams(sort: SortKey): SortMapping {
  return SORT_MAP[sort] ?? {}
}

/** Translate the API-key filter into the feed's `labels` expression. */
export function buildLabels(apiKey: ApiKeyFilter): string | undefined {
  if (apiKey === 'required') return 'requires_api_key:true'
  if (apiKey === 'none') return 'requires_api_key:false'
  return undefined
}

/** Clamp an arbitrary number into an integer range. */
function clampInt(value: number, min: number, max: number): number {
  const n = Number.isFinite(value) ? Math.trunc(value) : min
  return Math.min(max, Math.max(min, n))
}

/**
 * Build the exact query for `GET /api/skills`.
 * `all` sort and `all` source send nothing; pageSize is capped at the API's 100.
 */
export function buildListQuery(query: SkillQuery): URLSearchParams {
  const params = new URLSearchParams()
  params.set('page', String(clampInt(query.page, 1, 100_000)))
  params.set('pageSize', String(clampInt(query.pageSize, 1, 100)))

  const keyword = query.keyword.trim()
  if (keyword !== '') params.set('keyword', keyword)
  if (query.category !== '' && query.category !== 'all') params.set('category', query.category)
  if (query.source !== 'all') params.set('source', query.source)

  const labels = buildLabels(query.apiKey)
  if (labels !== undefined) params.set('labels', labels)

  const sort = sortParams(query.sort)
  if (sort.sortBy !== undefined) params.set('sortBy', sort.sortBy)
  if (sort.order !== undefined) params.set('order', sort.order)
  return params
}

/** Feed URL for one list request. */
export function listUrl(query: SkillQuery): string {
  return `${SKILLHUB_API}${SKILLS_PATH}?${buildListQuery(query).toString()}`
}

/** Feed URL for one skill's detail payload. */
export function detailUrl(slug: string, namespace?: string): string {
  const base = `${SKILLHUB_API}${DETAIL_PATH}/${encodeURIComponent(slug)}`
  return namespace === undefined || namespace === '' ? base : `${base}?namespace=${encodeURIComponent(namespace)}`
}

/** Feed URL for a skill ZIP. */
export function downloadUrl(slug: string): string {
  return `${SKILLHUB_API}${DOWNLOAD_PATH}?slug=${encodeURIComponent(slug)}`
}

/** Detail page on the public site. */
export function skillhubDetailUrl(slug: string): string {
  return `${SKILLHUB_WEB}/skills/${encodeURIComponent(slug)}`
}

/** The source label shown to users: ClawHub items that are claimed display as community. */
export function displaySource(raw: {
  source?: unknown
  claim_state?: unknown
  isAuthorVerified?: unknown
  verified?: unknown
}): string {
  const source = typeof raw.source === 'string' ? raw.source : ''
  const claimed = raw.claim_state != null
    ? raw.claim_state === 'claimed'
    : raw.isAuthorVerified === true || raw.verified === true
  return source === 'clawhub' && claimed ? 'community' : source
}

/** Read a finite number from a JSON scalar. */
function numberOr(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

/** Read an optional finite number. */
function optionalNumber(value: unknown): number | undefined {
  const n = numberOr(value, Number.NaN)
  return Number.isFinite(n) ? n : undefined
}

/** Epoch milliseconds from epoch numbers, numeric strings or ISO timestamps. */
export function toEpochMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value < 1e12 ? value * 1000 : value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1000 : n
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** Whether a URL points at github.com (or www.github.com). */
export function isGithubUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && /^(www\.)?github\.com$/i.test(url.hostname)
  } catch {
    return false
  }
}

/**
 * Pick a GitHub repository URL from the fields the API actually returns.
 * `homepage` is often an api.skillhub.cn profile URL, so it is only accepted
 * when it is genuinely a GitHub host. ClawHub `upstream_url` values are not
 * GitHub and fall through to the Skillhub detail page in the UI.
 */
export function resolveGithubUrl(raw: Record<string, unknown>): string | undefined {
  const candidates = [
    raw.upstream_url,
    raw.upstreamUrl,
    raw.sourceUrl,
    raw.source_url,
    raw.githubUrl,
    raw.repository,
    raw.homepage,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate !== '' && isGithubUrl(candidate)) return candidate
  }
  return undefined
}

/** Normalize Skillhub's string-valued labels object. */
export function normalizeLabels(value: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return out
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') out[key] = String(raw)
  }
  return out
}

/** Normalize tags/subCategories, which arrive either as arrays or objects. */
function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string')
  if (value !== null && typeof value === 'object') return Object.keys(value as Record<string, unknown>)
  return []
}

/** Normalize sub-category entries from list or detail payloads. */
function normalizeSubCategories(value: unknown): Array<{ key: string; name: string }> {
  if (!Array.isArray(value)) return []
  const out: Array<{ key: string; name: string }> = []
  for (const entry of value) {
    if (entry === null || typeof entry !== 'object') continue
    const item = entry as Record<string, unknown>
    if (typeof item.key !== 'string') continue
    out.push({ key: item.key, name: typeof item.name === 'string' ? item.name : item.key })
  }
  return out
}

/** First non-empty string among the candidates. */
function firstString(...values: unknown[]): string {
  for (const value of values) if (typeof value === 'string' && value.trim() !== '') return value.trim()
  return ''
}

/** Normalize one list/detail item; tolerates snake_case and camelCase. */
export function normalizeSkill(rawValue: unknown): RemoteSkill {
  const raw = rawValue !== null && typeof rawValue === 'object' ? rawValue as Record<string, unknown> : {}
  const stats = raw.stats !== null && typeof raw.stats === 'object' ? raw.stats as Record<string, unknown> : {}
  const namespace = raw.namespace !== null && typeof raw.namespace === 'object' ? raw.namespace as Record<string, unknown> : {}
  const publisher = raw.publisher !== null && typeof raw.publisher === 'object' ? raw.publisher as Record<string, unknown> : {}
  const slug = firstString(raw.slug, raw.id)
  const name = firstString(raw.name, raw.displayName, slug)
  const labels = normalizeLabels(raw.labels)
  const requiresApiKey = labels.requires_api_key === undefined ? undefined : labels.requires_api_key === 'true'

  return {
    slug,
    name,
    displayName: firstString(raw.displayName, raw.name, slug),
    description: firstString(raw.description, raw.summary, raw.summary_zh, raw.description_zh),
    descriptionZh: firstString(raw.description_zh, raw.summary_zh),
    category: firstString(raw.category),
    subCategories: normalizeSubCategories(raw.subCategories ?? raw.sub_categories),
    source: displaySource(raw),
    labels,
    downloads: numberOr(raw.downloads ?? stats.downloads, 0),
    stars: numberOr(raw.stars ?? stats.stars, 0),
    installs: numberOr(raw.installs ?? stats.installs, 0),
    requiresApiKey,
    updatedAt: toEpochMs(raw.updated_at ?? raw.updatedAt),
    createdAt: toEpochMs(raw.created_at ?? raw.createdAt),
    homepage: firstString(raw.homepage) || undefined,
    githubUrl: resolveGithubUrl(raw),
    skillhubUrl: skillhubDetailUrl(slug),
    iconUrl: firstString(raw.iconUrl, raw.icon_url) || undefined,
    version: firstString(raw.version, raw.latestVersion) || undefined,
    publisher: firstString(publisher.displayName, publisher.name, raw.ownerName) || undefined,
    namespaceHandle: firstString(namespace.handle, raw.upstream_owner_login, raw.githubAuthorLogin) || undefined,
    tags: normalizeTags(raw.tags),
    overviewMd: firstString(raw.overviewMd, raw.overview_md) || undefined,
  }
}

/** Normalize the list response envelope and validate `code`. */
export function normalizeListPayload(payload: unknown): SkillListResult {
  const root = payload !== null && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const data = root.data !== null && typeof root.data === 'object' ? root.data as Record<string, unknown> : {}
  const rawItems = Array.isArray(data.skills)
    ? data.skills
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(root.skills)
        ? root.skills
        : []
  return {
    items: rawItems.map(normalizeSkill),
    total: numberOr(data.total ?? root.total, rawItems.length),
    page: numberOr(data.page ?? root.page, 1),
    pageSize: numberOr(data.pageSize ?? root.pageSize, rawItems.length),
  }
}

/** Normalize a detail envelope (`{skill}` or a bare skill object). */
export function normalizeDetailPayload(payload: unknown): RemoteSkill {
  const root = payload !== null && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const data = root.data !== null && typeof root.data === 'object' ? root.data as Record<string, unknown> : {}
  const raw = (data.skill ?? root.skill ?? data) as unknown
  const skill = normalizeSkill(raw)
  const detailRaw = raw !== null && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  return {
    ...skill,
    overviewMd: skill.overviewMd ?? (firstString(detailRaw.overviewMd, detailRaw.overview_md) || undefined),
  }
}

/** Normalize `/api/v1/categories` (or a fallback-shaped payload). */
export function normalizeCategories(payload: unknown): CategoryOption[] {
  const root = payload !== null && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const data = root.data !== null && typeof root.data === 'object' ? root.data as Record<string, unknown> : {}
  const rawItems = Array.isArray(root.items) ? root.items : Array.isArray(data.items) ? data.items : []
  const out: CategoryOption[] = []
  for (const entry of rawItems) {
    if (entry === null || typeof entry !== 'object') continue
    const item = entry as Record<string, unknown>
    if (typeof item.key !== 'string' || item.active === false) continue
    out.push({
      key: item.key,
      name: firstString(item.name, item.key),
      nameEn: firstString(item.nameEn, item.name_en) || undefined,
    })
  }
  if (out.length === 0) return FALLBACK_CATEGORIES.map(entry => ({ ...entry }))
  return out
}

/** Safe, JSON-friendly frontmatter display value. */
export function frontmatterScalar(value: unknown): FrontmatterValue {
  if (typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string')
  return String(value)
}
