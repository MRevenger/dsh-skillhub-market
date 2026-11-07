import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { crc32, extractZip, findSkillRoot, readZipDirectory, ZipError } from '../src/host/zip.ts'

interface FixtureEntry {
  name: string
  data: string
}

/** Build a minimal stored-method ZIP; enough to exercise the defensive reader. */
function makeZip(entries: FixtureEntry[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const data = Buffer.from(entry.data, 'utf8')
    const checksum = crc32(data)

    const local = Buffer.alloc(30 + name.length + data.length)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    name.copy(local, 30)
    data.copy(local, 30 + name.length)

    const central = Buffer.alloc(46 + name.length)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    name.copy(central, 46)

    locals.push(local)
    centrals.push(central)
    offset += local.length
  }
  const central = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(central.length, 12)
  eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, central, eocd])
}

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'skillhub-zip-'))
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

test('rejects path traversal, absolute paths, drive letters and empty segments', () => {
  for (const name of ['../evil.txt', 'a/../../evil.txt', '/etc/passwd', 'C:/Windows/x', 'a\\\\..\\\\b', 'a//b']) {
    assert.throws(() => readZipDirectory(makeZip([{ name, data: 'x' }])), (error: unknown) => {
      assert.ok(error instanceof ZipError)
      assert.equal(error.code, 'UNSAFE_PATH')
      return true
    })
  }
})

test('accepts and ignores explicit directory entries', () => {
  const zip = makeZip([
    { name: 'pkg/', data: '' },
    { name: 'pkg/SKILL.md', data: '# wrapped' },
  ])
  const archive = readZipDirectory(zip)
  assert.equal(archive.entries.length, 2)
  assert.equal(archive.files.length, 1)
  assert.equal(findSkillRoot(archive.files).prefix, 'pkg/')
})

test('extracts root-level Skillhub archives and verifies SKILL.md', async () => {
  await withTempDir(async (dir) => {
    const zip = makeZip([
      { name: 'SKILL.md', data: '---\nname: pdf\n---\n# PDF' },
      { name: 'API.md', data: 'api docs' },
    ])
    const archive = readZipDirectory(zip)
    assert.equal(findSkillRoot(archive.files).prefix, '')
    const result = await extractZip(zip, dir)
    assert.equal(result.files, 2)
    assert.equal(await readFile(join(dir, 'SKILL.md'), 'utf8'), '---\nname: pdf\n---\n# PDF')
    assert.equal(await readFile(join(dir, 'API.md'), 'utf8'), 'api docs')
  })
})

test('accepts one wrapper directory and strips it during extraction', async () => {
  await withTempDir(async (dir) => {
    const zip = makeZip([
      { name: 'pkg/SKILL.md', data: '# wrapped' },
      { name: 'pkg/lib/tool.py', data: 'print(1)' },
    ])
    const archive = readZipDirectory(zip)
    assert.equal(findSkillRoot(archive.files).prefix, 'pkg/')
    await extractZip(zip, dir)
    assert.equal(await readFile(join(dir, 'SKILL.md'), 'utf8'), '# wrapped')
    assert.equal(await readFile(join(dir, 'lib', 'tool.py'), 'utf8'), 'print(1)')
  })
})

test('rejects archives without SKILL.md', async () => {
  await withTempDir(async (dir) => {
    const zip = makeZip([{ name: 'README.md', data: 'nope' }])
    const archive = readZipDirectory(zip)
    assert.throws(() => findSkillRoot(archive.files), (error: unknown) => {
      assert.ok(error instanceof ZipError)
      assert.equal(error.code, 'MISSING_SKILL_MD')
      return true
    })
    await assert.rejects(extractZip(zip, dir), (error: unknown) => {
      assert.ok(error instanceof ZipError)
      assert.equal(error.code, 'MISSING_SKILL_MD')
      return true
    })
  })
})

test('rejects duplicate paths (case-insensitive) and CRC mismatches', async () => {
  const duplicate = makeZip([
    { name: 'SKILL.md', data: 'a' },
    { name: 'skill.md', data: 'b' },
  ])
  assert.throws(() => readZipDirectory(duplicate), (error: unknown) => {
    assert.ok(error instanceof ZipError)
    assert.equal(error.code, 'DUPLICATE_ENTRY')
    return true
  })

  const zip = makeZip([{ name: 'SKILL.md', data: 'hello' }])
  // Corrupt the stored payload byte without touching the central directory CRC.
  const dataOffset = 30 + Buffer.byteLength('SKILL.md', 'utf8')
  zip[dataOffset] = 'j'.charCodeAt(0)
  await withTempDir(async (dir) => {
    await assert.rejects(extractZip(zip, dir), (error: unknown) => {
      assert.ok(error instanceof ZipError)
      assert.equal(error.code, 'INVALID_CRC')
      return true
    })
  })
})
