import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildLabels,
  buildListQuery,
  normalizeCategories,
  normalizeSkill,
  resolveGithubUrl,
  sortParams,
} from '../src/host/api-map.ts'
import type { SkillQuery } from '../src/shared/types.ts'

const baseQuery: SkillQuery = {
  keyword: '',
  page: 1,
  pageSize: 24,
  sort: 'all',
  source: 'all',
  category: 'all',
  apiKey: 'all',
}

test('sort mapping: all sends no sort, trending falls back to score, downloads/newest use real fields', () => {
  assert.deepEqual(sortParams('all'), {})
  assert.deepEqual(sortParams('trending'), { sortBy: 'score', order: 'desc', fallbackNote: true })
  assert.deepEqual(sortParams('downloads'), { sortBy: 'downloads', order: 'desc' })
  assert.deepEqual(sortParams('newest'), { sortBy: 'updated_at', order: 'desc' })

  const all = buildListQuery(baseQuery)
  assert.equal(all.has('sortBy'), false)
  assert.equal(all.has('order'), false)

  assert.equal(buildListQuery({ ...baseQuery, sort: 'trending' }).get('sortBy'), 'score')
  assert.equal(buildListQuery({ ...baseQuery, sort: 'downloads' }).get('sortBy'), 'downloads')
  assert.equal(buildListQuery({ ...baseQuery, sort: 'newest' }).get('sortBy'), 'updated_at')
  assert.equal(buildListQuery({ ...baseQuery, sort: 'newest' }).get('order'), 'desc')
})

test('filter mapping: keyword, source, category, API key and pagination', () => {
  const query = buildListQuery({
    ...baseQuery,
    keyword: '  pdf  ',
    page: 2,
    pageSize: 500,
    source: 'community',
    category: 'education',
    apiKey: 'required',
  })
  assert.equal(query.get('keyword'), 'pdf')
  assert.equal(query.get('page'), '2')
  assert.equal(query.get('pageSize'), '100')
  assert.equal(query.get('source'), 'community')
  assert.equal(query.get('category'), 'education')
  assert.equal(query.get('labels'), 'requires_api_key:true')

  assert.equal(buildLabels('all'), undefined)
  assert.equal(buildLabels('required'), 'requires_api_key:true')
  assert.equal(buildLabels('none'), 'requires_api_key:false')
})

test('no time-range filters are emitted, and empty/all filters are omitted', () => {
  const query = buildListQuery({ ...baseQuery, page: 0, pageSize: 0 })
  assert.equal(query.get('page'), '1')
  assert.equal(query.get('pageSize'), '1')
  for (const key of ['keyword', 'source', 'category', 'labels', 'sortBy', 'order', 'days', 'period', 'from', 'to']) {
    assert.equal(query.has(key), false, `unexpected query parameter: ${key}`)
  }
})

test('GitHub URL resolution only accepts github.com and checks real API fields first', () => {
  assert.equal(
    resolveGithubUrl({ homepage: 'https://api.skillhub.cn/user/x', upstream_url: 'https://github.com/acme/repo' }),
    'https://github.com/acme/repo',
  )
  assert.equal(resolveGithubUrl({ homepage: 'https://github.com/acme/repo' }), 'https://github.com/acme/repo')
  assert.equal(resolveGithubUrl({ homepage: 'https://api.skillhub.cn/user/x' }), undefined)
  assert.equal(resolveGithubUrl({ upstream_url: 'https://clawhub.ai/acme/repo' }), undefined)
  assert.equal(resolveGithubUrl({ homepage: 'https://evil.example/github.com/acme' }), undefined)
})

test('normalizes list and detail payloads, including stats and labels', () => {
  const skill = normalizeSkill({
    slug: 'pdf-skill',
    name: 'pdf-skill',
    displayName: 'PDF 助手',
    description: '处理 PDF',
    description_zh: '处理 PDF 文件',
    labels: { requires_api_key: 'true' },
    category: 'education',
    stats: { downloads: 12, stars: 3, installs: 4 },
    updatedAt: '2026-11-01T00:00:00.000Z',
    homepage: 'https://github.com/acme/pdf',
  })
  assert.equal(skill.slug, 'pdf-skill')
  assert.equal(skill.displayName, 'PDF 助手')
  assert.equal(skill.descriptionZh, '处理 PDF 文件')
  assert.equal(skill.requiresApiKey, true)
  assert.equal(skill.downloads, 12)
  assert.equal(skill.stars, 3)
  assert.equal(skill.installs, 4)
  assert.equal(skill.githubUrl, 'https://github.com/acme/pdf')
  assert.equal(skill.skillhubUrl, 'https://skillhub.cn/skills/pdf-skill')
  assert.equal(skill.updatedAt, Date.parse('2026-11-01T00:00:00.000Z'))
})

test('categories fall back to the probed live list when the payload is empty', () => {
  const categories = normalizeCategories({ items: [] })
  assert.ok(categories.length >= 13)
  assert.ok(categories.some(entry => entry.key === 'education'))
  const live = normalizeCategories({ items: [{ key: 'custom', name: '自定义', active: true }] })
  assert.deepEqual(live, [{ key: 'custom', name: '自定义', nameEn: undefined }])
})
