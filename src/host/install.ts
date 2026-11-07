/**
 * Download-and-install pipeline.
 *
 * The ZIP is extracted into a hidden temp directory inside `$DSH_HOME/skills`
 * first, so a bad archive never leaves a half-written skill behind. Replacing
 * an existing skill is explicit: the caller must pass `overwrite: true` (the
 * UI asks the user first), and the old directory is only moved aside after the
 * new archive has been fully extracted.
 */
import { mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { InstallResult } from '../shared/types.ts'
import { downloadUrl } from './api-map.ts'
import { fetchZip } from './http.ts'
import { normalizeInstallSlug, recordInstallMeta, skillsRoot } from './store.ts'
import { extractZip } from './zip.ts'

/** A conflict or install error with an HTTP-friendly code. */
export class InstallError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status = 400) {
    super(message)
    this.name = 'InstallError'
    this.code = code
    this.status = status
  }
}

/** Whether a path exists. */
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

/** Options for one install. */
export interface InstallOptions {
  dshHome: string
  slug: string
  overwrite: boolean
  sourceHomepage?: string
}

/**
 * Download and install one skill into `$DSH_HOME/skills/<slug>`.
 * @throws InstallError for conflicts, invalid archives, and filesystem errors.
 */
export async function installSkill(options: InstallOptions): Promise<InstallResult> {
  const slug = normalizeInstallSlug(options.slug)
  const root = skillsRoot(options.dshHome)
  await mkdir(root, { recursive: true })
  const target = join(root, slug)
  const existed = await exists(target)
  if (existed && !options.overwrite) {
    throw new InstallError(`技能「${slug}」已存在`, 'ALREADY_EXISTS', 409)
  }

  const zip = await fetchZip(downloadUrl(slug))
  let temp: string | undefined
  let fileCount = 0
  let backup: string | undefined
  let movedOld = false
  let installed = false
  try {
    temp = await mkdtemp(join(root, '.skillhub-tmp-'))
    const extracted = await extractZip(zip, temp)
    fileCount = extracted.files
    const skillMd = await stat(extracted.skillMdPath)
    if (!skillMd.isFile()) throw new InstallError('技能包缺少 SKILL.md，已判定为无效技能', 'MISSING_SKILL_MD')

    if (existed) {
      backup = join(root, `.skillhub-backup-${slug}-${Date.now()}`)
      await rename(target, backup)
      movedOld = true
    }
    try {
      await rename(temp, target)
      temp = undefined
      installed = true
    } catch (error) {
      throw new InstallError(
        `写入技能目录失败：${error instanceof Error ? error.message : String(error)}`,
        'INSTALL_FAILED',
        (error as NodeJS.ErrnoException).code === 'EPERM' ? 403 : 500,
      )
    }
  } catch (error) {
    if (movedOld && backup !== undefined && !installed) {
      try { await rename(backup, target); backup = undefined } catch { /* keep backup path for the message */ }
    }
    throw error
  } finally {
    if (temp !== undefined) {
      try { await rm(temp, { recursive: true, force: true }) } catch { /* temp cleanup is best effort */ }
    }
  }

  if (backup !== undefined) {
    try { await rm(backup, { recursive: true, force: true }) } catch { /* old copy cleanup is best effort */ }
  }
  const metaWarning = await recordInstallMeta(options.dshHome, slug, options.sourceHomepage)
  return {
    slug,
    path: target,
    files: fileCount,
    overwritten: existed,
    ...(metaWarning === undefined ? {} : { metaWarning }),
  }
}
