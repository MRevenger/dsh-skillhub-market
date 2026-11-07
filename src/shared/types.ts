/** Shared types between the Skillhub host routes and the browser bundle. */

/** The four sort choices the market UI exposes. */
export type SortKey = 'all' | 'trending' | 'downloads' | 'newest'

/** Sources the Skillhub list feed accepts. `all` sends no source parameter. */
export type SourceKey = 'all' | 'community' | 'clawhub' | 'enterprise'

/** API-key filter mapped to the list feed's `labels` parameter. */
export type ApiKeyFilter = 'all' | 'required' | 'none'

/** Parameters for one market list request. No time-range parameter exists. */
export interface SkillQuery {
  keyword: string
  page: number
  pageSize: number
  sort: SortKey
  source: SourceKey
  category: string
  apiKey: ApiKeyFilter
}

/** One normalized Skillhub list/detail item. */
export interface RemoteSkill {
  slug: string
  name: string
  displayName: string
  description: string
  descriptionZh: string
  category: string
  subCategories: Array<{ key: string; name: string }>
  source: string
  labels: Record<string, string>
  downloads: number
  stars: number
  installs: number
  requiresApiKey?: boolean
  updatedAt?: number
  createdAt?: number
  homepage?: string
  githubUrl?: string
  skillhubUrl: string
  iconUrl?: string
  version?: string
  publisher?: string
  namespaceHandle?: string
  tags: string[]
  overviewMd?: string
}

/** A page of normalized market items. */
export interface SkillListResult {
  items: RemoteSkill[]
  total: number
  page: number
  pageSize: number
}

/** A live category option (`/api/v1/categories`). */
export interface CategoryOption {
  key: string
  name: string
  nameEn?: string
}

/** Parsed `SKILL.md` frontmatter, kept as JSON-safe scalars/arrays. */
export type FrontmatterValue = string | number | boolean | string[] | number[]
export type Frontmatter = Record<string, FrontmatterValue>

/** User-owned metadata stored in `$DSH_HOME/skillhub-custom.json`. */
export interface CustomSkillMeta {
  slug: string
  displayName?: string
  note?: string
  downloadedAt?: string
  sourceHomepage?: string
}

/** One locally installed skill discovered under `$DSH_HOME/skills`. */
export interface InstalledSkill {
  /** Directory name, also the install slug and metadata key. */
  slug: string
  /** `frontmatter.name`, or the directory name when absent. */
  name: string
  /** Custom name > frontmatter name > directory name. */
  displayName: string
  /** Custom note, when the user wrote one. */
  note?: string
  /** Frontmatter description, then `description_zh`, then empty. */
  description: string
  descriptionZh?: string
  version?: string
  category?: string
  requiresApiKey?: boolean
  sourceHomepage?: string
  githubUrl?: string
  path: string
  updatedAt?: string
  frontmatter: Frontmatter
  /** `SKILL.md` body without frontmatter. */
  body: string
  /** Present when the file was found but could not be parsed/read. */
  error?: string
}

/** Payload for the installed list route. */
export interface InstalledListResult {
  skills: InstalledSkill[]
  dshHome: string
  skillsRoot: string
  metaError?: string
}

/** Result of a successful install. */
export interface InstallResult {
  slug: string
  path: string
  files: number
  overwritten: boolean
  metaWarning?: string
}

/** A JSON error returned by the host routes. */
export interface ApiErrorBody {
  error: string
  code?: string
}
