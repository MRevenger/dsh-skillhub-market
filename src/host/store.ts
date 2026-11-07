/**
 * Local skill discovery and user metadata.
 *
 * Installed skills live in `$DSH_HOME/skills/<dir>/SKILL.md`. The user's
 * display name and note live in a separate `$DSH_HOME/skillhub-custom.json`;
 * `SKILL.md` is never rewritten, so Harness skill discovery keeps seeing the
 * original `name`.
 */
import { readFile, readdir, rename, stat, writeFile, mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { CustomSkillMeta, Frontmatter, InstalledSkill, InstalledListResult } from '../shared/types.ts'
import { isGithubUrl } from './api-map.ts'
import { frontmatterString, parseSkillMarkdown } from './frontmatter.ts'

/** Expand a leading `~` and resolve a configured home path. */
function expandHome(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '~') return homedir()
  if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) return resolve(homedir(), trimmed.slice(2))
  return resolve(trimmed)
}

/**
 * Resolve the DeepSeek Harness home.
 * Precedence: plugin config > `$DSH_HOME` > `~/.dsh` (the same contract as
 * `@deepseek-ai/dsh-home-paths`; implemented locally so the bundle has no
 * runtime dependency on an optional host package).
 */
export function resolveDshHome(configured?: string): string {
  if (typeof configured === 'string' && configured.trim() !== '') return expandHome(configured)
  const env = process.env.DSH_HOME
  if (typeof env === 'string' && env.trim() !== '') return expandHome(env)
  return join(homedir(), '.dsh')
}

/** The user-level skills directory. */
export function skillsRoot(dshHome: string): string {
  return join(dshHome, 'skills')
}

/** The custom metadata file path. */
export function customMetaPath(dshHome: string): string {
  return join(dshHome, 'skillhub-custom.json')
}

/** Reject a value that is not exactly one safe path segment. */
export function assertSafeDirName(name: string): string {
  const trimmed = name.trim()
  if (trimmed === '' || trimmed === '.' || trimmed === '..') throw new Error('技能目录名无效')
  if (trimmed.length > 128) throw new Error('技能目录名过长')
  if (/[\\/:*?"<>|\0]/.test(trimmed) || trimmed.includes('/')) throw new Error('技能目录名包含非法字符')
  if (trimmed.endsWith('.')) throw new Error('技能目录名不能以点结尾')
  return trimmed
}

/** Validate an API slug before it becomes an install directory. */
export function normalizeInstallSlug(slug: string): string {
  const trimmed = slug.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(trimmed) || trimmed.endsWith('.')) {
    throw new Error('技能 slug 不合法，无法安装')
  }
  return trimmed
}

/** True for a plain object (not an array/null). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Coerce one stored entry, dropping anything unrecognized. */
function sanitizeMeta(slug: string, value: unknown): CustomSkillMeta | undefined {
  if (!isRecord(value)) return undefined
  const out: CustomSkillMeta = { slug }
  if (typeof value.displayName === 'string') out.displayName = value.displayName
  if (typeof value.note === 'string') out.note = value.note
  if (typeof value.downloadedAt === 'string') out.downloadedAt = value.downloadedAt
  if (typeof value.sourceHomepage === 'string' && /^https?:\/\//i.test(value.sourceHomepage)) {
    out.sourceHomepage = value.sourceHomepage
  }
  return out
}

/** Read the custom metadata document, reporting (not throwing) corruption. */
export async function readCustomMeta(dshHome: string): Promise<{ data: Record<string, CustomSkillMeta>; error?: string }> {
  const path = customMetaPath(dshHome)
  let text: string
  try {
    text = await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { data: {} }
    return { data: {}, error: `读取 skillhub-custom.json 失败：${error instanceof Error ? error.message : String(error)}` }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return { data: {}, error: `skillhub-custom.json 不是有效 JSON：${error instanceof Error ? error.message : String(error)}` }
  }
  if (!isRecord(parsed)) return { data: {}, error: 'skillhub-custom.json 结构无效（应为对象）' }
  const data: Record<string, CustomSkillMeta> = {}
  for (const [slug, value] of Object.entries(parsed)) {
    const entry = sanitizeMeta(slug, value)
    if (entry !== undefined) data[slug] = entry
  }
  return { data }
}

/** Write the metadata document atomically enough for a small JSON file. */
export async function writeCustomMeta(dshHome: string, data: Record<string, CustomSkillMeta>): Promise<void> {
  const path = customMetaPath(dshHome)
  await mkdir(dshHome, { recursive: true })
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`
  try {
    await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await rename(temp, path)
  } catch (error) {
    try { await rm(temp, { force: true }) } catch { /* best effort */ }
    throw new Error(`保存 skillhub-custom.json 失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Save one skill's display name and note, preserving its other fields. */
export async function saveCustomEntry(
  dshHome: string,
  input: { slug: string; displayName: string; note: string },
): Promise<CustomSkillMeta> {
  const slug = assertSafeDirName(input.slug)
  const current = await readCustomMeta(dshHome)
  if (current.error !== undefined) throw new Error(`${current.error}；请先修复该文件再保存`)
  const previous = current.data[slug]
  const entry: CustomSkillMeta = {
    slug,
    ...(previous?.downloadedAt === undefined ? {} : { downloadedAt: previous.downloadedAt }),
    ...(previous?.sourceHomepage === undefined ? {} : { sourceHomepage: previous.sourceHomepage }),
  }
  const displayName = input.displayName.trim().slice(0, 120)
  const note = input.note.trim().slice(0, 2000)
  if (displayName !== '') entry.displayName = displayName
  if (note !== '') entry.note = note
  const next = { ...current.data, [slug]: entry }
  await writeCustomMeta(dshHome, next)
  return entry
}

/** Record install time/source without touching user-authored name/note. */
export async function recordInstallMeta(
  dshHome: string,
  slug: string,
  sourceHomepage?: string,
): Promise<string | undefined> {
  const current = await readCustomMeta(dshHome)
  if (current.error !== undefined) return current.error
  const previous = current.data[slug] ?? { slug }
  const next: CustomSkillMeta = {
    ...previous,
    slug,
    downloadedAt: new Date().toISOString(),
  }
  if (sourceHomepage !== undefined && /^https?:\/\//i.test(sourceHomepage)) next.sourceHomepage = sourceHomepage
  try {
    await writeCustomMeta(dshHome, { ...current.data, [slug]: next })
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/** First string value among frontmatter candidates, arrays included. */
function frontmatterText(frontmatter: Frontmatter, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = frontmatter[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0]
      if (typeof first === 'string' && first.trim() !== '') return first.trim()
    }
  }
  return undefined
}

/** Resolve the GitHub URL from custom metadata or frontmatter fields. */
function localGithubUrl(frontmatter: Frontmatter, meta: CustomSkillMeta | undefined): string | undefined {
  if (meta?.sourceHomepage !== undefined && isGithubUrl(meta.sourceHomepage)) return meta.sourceHomepage
  for (const key of ['homepage', 'sourceUrl', 'source_url', 'repository', 'githubUrl', 'upstream_url']) {
    const value = frontmatterText(frontmatter, key)
    if (value !== undefined && isGithubUrl(value)) return value
  }
  return undefined
}

/** Read one installed skill directory. */
async function readInstalledSkill(
  dshHome: string,
  dirName: string,
  meta: CustomSkillMeta | undefined,
): Promise<InstalledSkill> {
  const path = join(skillsRoot(dshHome), dirName)
  const skillMd = join(path, 'SKILL.md')
  const base: InstalledSkill = {
    slug: dirName,
    name: dirName,
    displayName: meta?.displayName?.trim() || dirName,
    note: meta?.note,
    description: '',
    path,
    frontmatter: {},
    body: '',
  }
  try {
    const info = await stat(skillMd)
    if (info.size > 2 * 1024 * 1024) throw new Error('SKILL.md 超过 2MB，无法显示')
    const text = await readFile(skillMd, 'utf8')
    const parsed = parseSkillMarkdown(text)
    const frontmatter = parsed.frontmatter
    const name = frontmatterText(frontmatter, 'name') ?? dirName
    const description = frontmatterText(frontmatter, 'description', 'description_zh') ?? ''
    const descriptionZh = frontmatterText(frontmatter, 'description_zh')
    const requiresRaw = frontmatter['requires_api_key'] ?? frontmatter['labels.requires_api_key']
    const requiresApiKey = typeof requiresRaw === 'boolean'
      ? requiresRaw
      : typeof requiresRaw === 'string'
        ? requiresRaw.toLowerCase() === 'true'
        : undefined
    const sourceHomepage = meta?.sourceHomepage
      ?? frontmatterText(frontmatter, 'homepage', 'sourceUrl', 'source_url', 'repository')
    return {
      ...base,
      name,
      displayName: meta?.displayName?.trim() || name || dirName,
      description,
      descriptionZh,
      version: frontmatterText(frontmatter, 'version'),
      category: frontmatterText(frontmatter, 'category'),
      requiresApiKey,
      sourceHomepage,
      githubUrl: localGithubUrl(frontmatter, meta),
      updatedAt: info.mtime.toISOString(),
      frontmatter,
      body: parsed.body,
    }
  } catch (error) {
    return {
      ...base,
      error: `读取 ${dirName}/SKILL.md 失败：${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/** Scan every child directory that contains a `SKILL.md`. */
export async function scanInstalled(dshHome: string): Promise<InstalledListResult> {
  const root = skillsRoot(dshHome)
  const custom = await readCustomMeta(dshHome)
  const skills: InstalledSkill[] = []
  let dirs: import('node:fs').Dirent[] = []
  try {
    dirs = await readdir(root, { withFileTypes: true })
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      return { skills, dshHome, skillsRoot: root, metaError: `读取技能目录失败：${error instanceof Error ? error.message : String(error)}` }
    }
  }
  for (const entry of dirs) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const meta = custom.data[entry.name]
    const skill = await readInstalledSkill(dshHome, entry.name, meta)
    if (skill.error === undefined || skill.frontmatter !== undefined) {
      // Include readable skills; unreadable ones are included with their error
      // only when they actually have a SKILL.md, so empty dirs stay hidden.
      try {
        await stat(join(root, entry.name, 'SKILL.md'))
        skills.push(skill)
      } catch { /* no SKILL.md: not an installed skill */ }
    }
  }
  skills.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-Hans-CN'))
  return { skills, dshHome, skillsRoot: root, ...(custom.error === undefined ? {} : { metaError: custom.error }) }
}

/** Read one installed skill's full detail. */
export async function getInstalledDetail(dshHome: string, dirName: string): Promise<InstalledSkill> {
  const slug = assertSafeDirName(dirName)
  const root = skillsRoot(dshHome)
  const path = join(root, slug)
  if (!path.startsWith(resolve(root))) throw new Error('技能目录越界')
  const custom = await readCustomMeta(dshHome)
  const skill = await readInstalledSkill(dshHome, slug, custom.data[slug])
  if (skill.error !== undefined) throw new Error(skill.error)
  return skill
}
