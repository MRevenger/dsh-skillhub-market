/** Small display helpers shared by the market and downloaded views. */
import type { Translate } from './locale.ts'

/** Compact number, e.g. 1.2K / 3.4万. */
export function formatCount(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  try {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  } catch {
    return String(value)
  }
}

/** Localized short date from epoch milliseconds or an ISO timestamp. */
export function formatDate(value: number | string | undefined): string {
  if (value === undefined) return '—'
  const time = typeof value === 'string' ? Date.parse(value) : value
  if (!Number.isFinite(time) || time <= 0) return '—'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '—'
  try {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

/** First visible character for an avatar fallback. */
export function initials(name: string): string {
  const trimmed = name.trim()
  return trimmed === '' ? '?' : Array.from(trimmed)[0]?.toUpperCase() ?? '?'
}

/** Translate a source value, keeping unknown API values visible. */
export function sourceLabel(source: string | undefined, t: Translate): string {
  if (source === undefined || source === '') return t('common.unknown')
  if (source === 'community' || source === 'clawhub' || source === 'enterprise') {
    return t(`source.${source}`)
  }
  return source
}

/** Turn an unknown thrown value into a user-facing message. */
export function errorText(error: unknown, t: Translate): string {
  if (error !== null && typeof error === 'object') {
    const code = (error as { code?: unknown }).code
    if (code === 'TIMEOUT') return t('error.timeout')
    if (code === 'NETWORK_ERROR') return t('error.network')
    if (code === 'INVALID_RESPONSE') return t('error.network')
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message !== '') return message
  }
  if (error instanceof Error && error.message !== '') return error.message
  return String(error)
}

/** Format a frontmatter display value. */
export function frontmatterText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(', ')
  if (value === null || value === undefined) return ''
  return String(value)
}
