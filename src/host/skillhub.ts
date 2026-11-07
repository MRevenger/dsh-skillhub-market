/** Skillhub data access: list, categories and detail. */
import type { CategoryOption, RemoteSkill, SkillListResult, SkillQuery } from '../shared/types.ts'
import {
  CATEGORIES_PATH,
  SKILLHUB_API,
  detailUrl,
  listUrl,
  normalizeCategories,
  normalizeDetailPayload,
  normalizeListPayload,
} from './api-map.ts'
import { fetchJson, HttpError } from './http.ts'

/** Fetch one page of the market feed. */
export async function listSkills(query: SkillQuery): Promise<SkillListResult> {
  const payload = await fetchJson(listUrl(query))
  return normalizeListPayload(payload)
}

/** Fetch live category options. */
export async function getCategories(): Promise<CategoryOption[]> {
  const payload = await fetchJson(`${SKILLHUB_API}${CATEGORIES_PATH}`, { timeoutMs: 10_000 })
  return normalizeCategories(payload)
}

/** Fetch one skill's detail payload. */
export async function getSkillDetail(slug: string, namespace?: string): Promise<RemoteSkill> {
  if (slug.trim() === '') throw new HttpError('缺少技能 slug', 'INVALID_ARGUMENT', 400)
  const payload = await fetchJson(detailUrl(slug, namespace))
  return normalizeDetailPayload(payload)
}
