/**
 * Minimal, defensive ZIP reader/extractor.
 *
 * Only the classic ZIP central directory is supported (no ZIP64), and only the
 * stored/deflate methods Skillhub packages use. Every entry path is validated
 * before extraction: absolute paths, drive letters and any `..` segment are
 * rejected, so an archive can never write outside the chosen skills directory.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { inflateRawSync } from 'node:zlib'

/** Stable ZIP error codes surfaced to the UI. */
export type ZipErrorCode =
  | 'INVALID_ZIP'
  | 'ZIP64_UNSUPPORTED'
  | 'UNSAFE_PATH'
  | 'UNSUPPORTED_COMPRESSION'
  | 'ENCRYPTED_ZIP'
  | 'ENTRY_TOO_LARGE'
  | 'TOO_MANY_ENTRIES'
  | 'INVALID_CRC'
  | 'DUPLICATE_ENTRY'
  | 'MISSING_SKILL_MD'
  | 'EXTRACT_FAILED'

/** A ZIP error with a code the route can return verbatim. */
export class ZipError extends Error {
  readonly code: ZipErrorCode

  constructor(code: ZipErrorCode, message: string) {
    super(message)
    this.name = 'ZipError'
    this.code = code
  }
}

/** Limits applied to every archive. */
export const ZIP_LIMITS = {
  maxEntries: 500,
  maxEntryBytes: 16 * 1024 * 1024,
  maxTotalBytes: 64 * 1024 * 1024,
  maxPathLength: 1024,
} as const

/** One central-directory entry. */
export interface ZipEntry {
  name: string
  method: number
  flags: number
  crc32: number
  compressedSize: number
  uncompressedSize: number
  localOffset: number
  externalAttrs: number
}

/** A parsed archive (central directory only; data is read on demand). */
export interface ZipArchive {
  entries: ZipEntry[]
  files: ZipEntry[]
}

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50
const LOCAL_SIGNATURE = 0x04034b50

/** Locate the end-of-central-directory record. */
function findEocd(buffer: Buffer): number {
  const min = Math.max(0, buffer.length - 65_535 - 22)
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) !== EOCD_SIGNATURE) continue
    const commentLength = buffer.readUInt16LE(offset + 20)
    if (offset + 22 + commentLength === buffer.length) return offset
  }
  throw new ZipError('INVALID_ZIP', 'ZIP 文件损坏：找不到中央目录')
}

/**
 * Validate a ZIP member path and return its normalised `a/b/c` form.
 * Backslashes are treated as separators because Windows would.
 */
export function assertSafeZipPath(rawName: string): string {
  if (rawName === '' || rawName.length > ZIP_LIMITS.maxPathLength) {
    throw new ZipError('UNSAFE_PATH', `ZIP 内路径无效：${rawName.slice(0, 80)}`)
  }
  if (rawName.includes('\0')) throw new ZipError('UNSAFE_PATH', 'ZIP 内路径包含空字符')
  const name = rawName.replaceAll('\\', '/')
  if (name.startsWith('/')) throw new ZipError('UNSAFE_PATH', `ZIP 内不允许绝对路径：${name}`)
  if (/^[A-Za-z]:/.test(name)) throw new ZipError('UNSAFE_PATH', `ZIP 内不允许盘符路径：${name}`)
  const segments = name.split('/')
  for (const segment of segments) {
    if (segment === '..') throw new ZipError('UNSAFE_PATH', `ZIP 内不允许路径穿越：${name}`)
    if (segment === '') throw new ZipError('UNSAFE_PATH', `ZIP 内不允许空路径段：${name}`)
  }
  return name
}

/** Read and validate the archive's central directory. */
export function readZipDirectory(buffer: Buffer): ZipArchive {
  if (buffer.length < 22) throw new ZipError('INVALID_ZIP', 'ZIP 文件过小')
  const eocd = findEocd(buffer)
  const diskNumber = buffer.readUInt16LE(eocd + 4)
  const centralDisk = buffer.readUInt16LE(eocd + 6)
  const entriesOnDisk = buffer.readUInt16LE(eocd + 8)
  const entryCount = buffer.readUInt16LE(eocd + 10)
  const centralSize = buffer.readUInt32LE(eocd + 12)
  const centralOffset = buffer.readUInt32LE(eocd + 16)
  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new ZipError('ZIP64_UNSUPPORTED', '暂不支持分卷 ZIP')
  }
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new ZipError('ZIP64_UNSUPPORTED', '暂不支持 ZIP64 技能包')
  }
  if (entryCount > ZIP_LIMITS.maxEntries) {
    throw new ZipError('TOO_MANY_ENTRIES', `技能包文件过多（最多 ${ZIP_LIMITS.maxEntries} 个）`)
  }
  if (centralOffset + centralSize > buffer.length) {
    throw new ZipError('INVALID_ZIP', 'ZIP 中央目录越界')
  }

  const entries: ZipEntry[] = []
  const names = new Set<string>()
  let totalBytes = 0
  let offset = centralOffset
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw new ZipError('INVALID_ZIP', 'ZIP 中央目录项损坏')
    }
    const flags = buffer.readUInt16LE(offset + 8)
    const method = buffer.readUInt16LE(offset + 10)
    const crc = buffer.readUInt32LE(offset + 16)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const uncompressedSize = buffer.readUInt32LE(offset + 24)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const externalAttrs = buffer.readUInt32LE(offset + 38)
    const localOffset = buffer.readUInt32LE(offset + 42)
    const next = offset + 46 + nameLength + extraLength + commentLength
    if (next > buffer.length) throw new ZipError('INVALID_ZIP', 'ZIP 中央目录项越界')
    if ((flags & 0x1) !== 0) throw new ZipError('ENCRYPTED_ZIP', '暂不支持加密的 ZIP')
    if (method !== 0 && method !== 8) {
      throw new ZipError('UNSUPPORTED_COMPRESSION', `不支持的 ZIP 压缩方式：${method}`)
    }
    if (compressedSize > ZIP_LIMITS.maxEntryBytes || uncompressedSize > ZIP_LIMITS.maxEntryBytes) {
      throw new ZipError('ENTRY_TOO_LARGE', 'ZIP 内单个文件过大')
    }
    totalBytes += uncompressedSize
    if (totalBytes > ZIP_LIMITS.maxTotalBytes) throw new ZipError('ENTRY_TOO_LARGE', 'ZIP 解压后总大小过大')

    const rawName = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    const isDirectory = rawName.endsWith('/') || rawName.endsWith('\\')
    const name = assertSafeZipPath(isDirectory ? rawName.slice(0, -1) : rawName) + (isDirectory ? '/' : '')
    const lookupName = isDirectory ? name.slice(0, -1) : name
    if (lookupName !== '') {
      if (names.has(lookupName.toLowerCase())) {
        throw new ZipError('DUPLICATE_ENTRY', `ZIP 内存在重复路径：${lookupName}`)
      }
      names.add(lookupName.toLowerCase())
    }
    if ((externalAttrs >>> 16 & 0xf000) === 0xa000) {
      throw new ZipError('UNSAFE_PATH', `ZIP 内不允许符号链接：${name}`)
    }
    entries.push({ name, method, flags, crc32: crc, compressedSize, uncompressedSize, localOffset, externalAttrs })
    offset = next
  }
  return { entries, files: entries.filter(entry => !entry.name.endsWith('/')) }
}

/** CRC-32 table, built once. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

/** Standard CRC-32. */
export function crc32(bytes: Buffer): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** Read, inflate and verify one entry's bytes. */
export function readZipEntry(buffer: Buffer, entry: ZipEntry): Buffer {
  if (entry.localOffset + 30 > buffer.length) throw new ZipError('INVALID_ZIP', 'ZIP 本地文件头越界')
  if (buffer.readUInt32LE(entry.localOffset) !== LOCAL_SIGNATURE) {
    throw new ZipError('INVALID_ZIP', 'ZIP 本地文件头损坏')
  }
  const nameLength = buffer.readUInt16LE(entry.localOffset + 26)
  const extraLength = buffer.readUInt16LE(entry.localOffset + 28)
  const start = entry.localOffset + 30 + nameLength + extraLength
  const end = start + entry.compressedSize
  if (start < 0 || end > buffer.length) throw new ZipError('INVALID_ZIP', 'ZIP 文件数据越界')
  const compressed = buffer.subarray(start, end)

  let data: Buffer
  if (entry.method === 0) {
    data = Buffer.from(compressed)
  } else {
    try {
      data = inflateRawSync(compressed, { maxOutputLength: ZIP_LIMITS.maxEntryBytes })
    } catch {
      throw new ZipError('INVALID_ZIP', `无法解压 ZIP 内的文件：${entry.name}`)
    }
  }
  if (data.length !== entry.uncompressedSize) {
    throw new ZipError('INVALID_ZIP', `ZIP 内文件大小不一致：${entry.name}`)
  }
  if (crc32(data) !== entry.crc32) {
    throw new ZipError('INVALID_CRC', `ZIP 内文件校验失败：${entry.name}`)
  }
  return data
}

/**
 * Find the `SKILL.md` root. Skillhub packages put files at the ZIP root; a
 * single wrapper directory is accepted defensively.
 */
export function findSkillRoot(files: ZipEntry[]): { prefix: string; skillMdName: string } {
  const names = files.map(entry => entry.name)
  const rootIndex = names.findIndex(name => name === 'SKILL.md')
  if (rootIndex >= 0) return { prefix: '', skillMdName: names[rootIndex]! }
  const topLevel = new Set(files.map(entry => entry.name.split('/')[0]!))
  if (topLevel.size === 1) {
    const top = [...topLevel][0]!
    const nested = names.find(name => name === `${top}/SKILL.md`)
    if (nested !== undefined) return { prefix: `${top}/`, skillMdName: nested }
  }
  throw new ZipError('MISSING_SKILL_MD', '技能包根目录缺少 SKILL.md，已判定为无效技能')
}

/** A successful extraction summary. */
export interface ExtractResult {
  files: number
  skillMdPath: string
}

/**
 * Safely extract an archive into `destDir`.
 * The caller supplies an empty temp directory; every target is re-checked to
 * stay under it before anything is written.
 */
export async function extractZip(buffer: Buffer, destDir: string): Promise<ExtractResult> {
  const archive = readZipDirectory(buffer)
  const layout = findSkillRoot(archive.files)
  const root = resolve(destDir)
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`
  let files = 0
  for (const entry of archive.files) {
    if (layout.prefix !== '' && !entry.name.startsWith(layout.prefix)) continue
    const relative = layout.prefix === '' ? entry.name : entry.name.slice(layout.prefix.length)
    if (relative === '') continue
    const safeRelative = assertSafeZipPath(relative)
    const target = resolve(root, ...safeRelative.split('/'))
    if (target !== root && !target.startsWith(rootPrefix)) {
      throw new ZipError('UNSAFE_PATH', `ZIP 内路径越界：${entry.name}`)
    }
    const data = readZipEntry(buffer, entry)
    try {
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, data)
    } catch (error) {
      throw new ZipError('EXTRACT_FAILED', `写入技能文件失败：${error instanceof Error ? error.message : String(error)}`)
    }
    files += 1
  }
  if (files === 0) throw new ZipError('MISSING_SKILL_MD', '技能包为空')
  const skillMdPath = resolve(root, 'SKILL.md')
  if (!skillMdPath.startsWith(rootPrefix)) throw new ZipError('UNSAFE_PATH', 'SKILL.md 路径越界')
  return { files, skillMdPath }
}
