import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { frontmatterBoolean, frontmatterString, parseSkillMarkdown } from '../src/host/frontmatter.ts'
import {
  customMetaPath,
  readCustomMeta,
  recordInstallMeta,
  saveCustomEntry,
  scanInstalled,
  writeCustomMeta,
} from '../src/host/store.ts'

async function withHome<T>(fn: (home: string) => Promise<T>): Promise<T> {
  const home = await mkdtemp(join(tmpdir(), 'skillhub-home-'))
  try {
    return await fn(home)
  } finally {
    await rm(home, { recursive: true, force: true })
  }
}

test('parses YAML frontmatter, quotes, lists and block scalars without touching the body', () => {
  const text = [
    '---',
    'name: pdf-skill',
    'displayName: "PDF 助手"',
    'description: >',
    '  first line',
    '  second line',
    'tags:',
    '  - pdf',
    '  - office',
    'requires_api_key: true',
    '---',
    '# Heading',
    '',
    'Body text.',
  ].join('\n')
  const parsed = parseSkillMarkdown(text)
  assert.equal(parsed.hasFrontmatter, true)
  assert.equal(frontmatterString(parsed.frontmatter, 'name'), 'pdf-skill')
  assert.equal(frontmatterString(parsed.frontmatter, 'displayName'), 'PDF 助手')
  assert.equal(frontmatterString(parsed.frontmatter, 'description'), 'first line second line')
  assert.deepEqual(parsed.frontmatter.tags, ['pdf', 'office'])
  assert.equal(frontmatterBoolean(parsed.frontmatter, 'requires_api_key'), true)
  assert.equal(parsed.body, '# Heading\n\nBody text.')
})

test('custom metadata round-trips, preserves fields on reinstall and sanitizes unknown data', async () => {
  await withHome(async (home) => {
    await saveCustomEntry(home, { slug: 'pdf-skill', displayName: '我的 PDF 助手', note: '每周报表' })
    let meta = await readCustomMeta(home)
    assert.equal(meta.error, undefined)
    assert.equal(meta.data['pdf-skill']?.displayName, '我的 PDF 助手')
    assert.equal(meta.data['pdf-skill']?.note, '每周报表')

    const warning = await recordInstallMeta(home, 'pdf-skill', 'https://github.com/acme/pdf')
    assert.equal(warning, undefined)
    meta = await readCustomMeta(home)
    assert.equal(meta.data['pdf-skill']?.displayName, '我的 PDF 助手')
    assert.equal(meta.data['pdf-skill']?.note, '每周报表')
    assert.equal(meta.data['pdf-skill']?.sourceHomepage, 'https://github.com/acme/pdf')
    assert.ok(meta.data['pdf-skill']?.downloadedAt)

    const disk = JSON.parse(await readFile(customMetaPath(home), 'utf8')) as Record<string, { note?: string }>
    assert.equal(disk['pdf-skill']?.note, '每周报表')
  })
})

test('corrupt metadata reports an error instead of crashing and is not overwritten blindly', async () => {
  await withHome(async (home) => {
    await mkdir(home, { recursive: true })
    await writeFile(customMetaPath(home), '{ broken json', 'utf8')
    const meta = await readCustomMeta(home)
    assert.equal(meta.data['pdf-skill'], undefined)
    assert.match(meta.error ?? '', /不是有效 JSON/)
    await assert.rejects(saveCustomEntry(home, { slug: 'pdf-skill', displayName: 'x', note: '' }), /请先修复/)
    assert.equal(await readFile(customMetaPath(home), 'utf8'), '{ broken json')
  })
})

test('scanInstalled reads SKILL.md and prefers the custom display name without rewriting the file', async () => {
  await withHome(async (home) => {
    const dir = join(home, 'skills', 'pdf-skill')
    await mkdir(dir, { recursive: true })
    const skillMd = [
      '---',
      'name: pdf-skill',
      'displayName: 原始名称',
      'description: 处理 PDF 文件',
      'homepage: https://github.com/acme/pdf',
      'requires_api_key: false',
      '---',
      '# PDF',
    ].join('\n')
    await writeFile(join(dir, 'SKILL.md'), skillMd, 'utf8')
    await writeCustomMeta(home, {
      'pdf-skill': { slug: 'pdf-skill', displayName: '自定义名称', note: '备注', sourceHomepage: 'https://github.com/acme/pdf' },
    })

    const result = await scanInstalled(home)
    assert.equal(result.skills.length, 1)
    const skill = result.skills[0]!
    assert.equal(skill.name, 'pdf-skill')
    assert.equal(skill.displayName, '自定义名称')
    assert.equal(skill.note, '备注')
    assert.equal(skill.description, '处理 PDF 文件')
    assert.equal(skill.requiresApiKey, false)
    assert.equal(skill.githubUrl, 'https://github.com/acme/pdf')
    assert.equal(await readFile(join(dir, 'SKILL.md'), 'utf8'), skillMd)
  })
})

test('scanInstalled skips directories without SKILL.md and tolerates a missing skills root', async () => {
  await withHome(async (home) => {
    await mkdir(join(home, 'skills', 'empty'), { recursive: true })
    const empty = await scanInstalled(home)
    assert.deepEqual(empty.skills, [])
    await rm(join(home, 'skills'), { recursive: true, force: true })
    const missing = await scanInstalled(home)
    assert.deepEqual(missing.skills, [])
  })
})
