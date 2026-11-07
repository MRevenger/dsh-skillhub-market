/**
 * `SKILL.md` frontmatter reader.
 *
 * This is a deliberately small YAML subset (scalars, quoted strings, inline and
 * block lists, literal/folded block scalars, nested blocks flattened) — enough
 * for skill metadata and never an eval-style parser. The body is returned
 * untouched for Markdown rendering.
 */
import type { Frontmatter, FrontmatterValue } from '../shared/types.ts'

/** Parse a quoted YAML string, with the common double-quote escapes. */
function unquote(value: string): string {
  const quote = value[0]
  const inner = value.slice(1, -1)
  if (quote === "'") return inner.replaceAll("''", "'")
  return inner
    .replaceAll('\\n', '\n')
    .replaceAll('\\r', '\r')
    .replaceAll('\\t', '\t')
    .replaceAll('\\"', '"')
    .replaceAll('\\\\', '\\')
}

/** Split an inline list on commas outside quotes. */
function splitInlineList(value: string): string[] {
  const out: string[] = []
  let current = ''
  let quote = ''
  for (const character of value) {
    if (quote !== '') {
      current += character
      if (character === quote) quote = ''
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      current += character
      continue
    }
    if (character === ',') {
      out.push(current.trim())
      current = ''
      continue
    }
    current += character
  }
  out.push(current.trim())
  return out
}

/** Parse one YAML scalar (or inline list). */
export function parseYamlScalar(raw: string): FrontmatterValue {
  const value = raw.trim()
  if (value === '') return ''
  if (value.startsWith('[') && value.endsWith(']')) {
    return splitInlineList(value.slice(1, -1))
      .map(entry => parseYamlScalar(entry))
      .filter((entry): entry is string | number => typeof entry === 'string' || typeof entry === 'number')
      .map(String)
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return unquote(value)
  }
  if (value === 'true' || value === 'TRUE') return true
  if (value === 'false' || value === 'FALSE') return false
  if (value === 'null' || value === '~') return ''
  if (/^-?\d+$/.test(value)) {
    const number = Number(value)
    return Number.isSafeInteger(number) ? number : value
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    const number = Number(value)
    return Number.isFinite(number) ? number : value
  }
  return value
}

/** Collect the indented continuation lines that belong to a key. */
function collectIndented(lines: string[], start: number, parentIndent: number): { lines: string[]; next: number } {
  const collected: string[] = []
  let index = start
  while (index < lines.length) {
    const line = lines[index]!
    if (line.trim() === '') {
      collected.push('')
      index += 1
      continue
    }
    const indent = line.length - line.trimStart().length
    if (indent <= parentIndent) break
    collected.push(line.slice(Math.min(indent, parentIndent + 2)))
    index += 1
  }
  while (collected.length > 0 && collected[collected.length - 1] === '') collected.pop()
  return { lines: collected, next: index }
}

/** Parse the frontmatter block into JSON-safe values. */
export function parseFrontmatterBlock(block: string): Frontmatter {
  const lines = block.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
  const out: Frontmatter = {}
  let index = 0
  while (index < lines.length) {
    const line = lines[index]!
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      index += 1
      continue
    }
    const indent = line.length - line.trimStart().length
    const match = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(line.trim())
    if (match === null) {
      index += 1
      continue
    }
    const key = match[1]!
    const rest = match[2] ?? ''
    if (rest === '|' || rest === '>' || rest === '|-' || rest === '>-' || rest === '|+' || rest === '>+') {
      const folded = rest.startsWith('>')
      const collected = collectIndented(lines, index + 1, indent)
      out[key] = folded ? collected.lines.join(' ').trim() : collected.lines.join('\n')
      index = collected.next
      continue
    }
    if (rest === '') {
      const collected = collectIndented(lines, index + 1, indent)
      const listEntries = collected.lines.filter(entry => entry.trimStart().startsWith('- '))
      if (listEntries.length > 0 && listEntries.length === collected.lines.filter(entry => entry.trim() !== '').length) {
        out[key] = listEntries.map(entry => String(parseYamlScalar(entry.trimStart().slice(2))))
      } else if (collected.lines.length > 0) {
        // Nested mappings are flattened for display (`metadata.foo`).
        const nested = collected.lines
          .filter(entry => entry.trim() !== '')
          .map(entry => entry.trim())
          .join('\n')
        const nestedMap: Frontmatter = {}
        for (const nestedLine of nested.split('\n')) {
          const nestedMatch = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(nestedLine)
          if (nestedMatch !== null) nestedMap[nestedMatch[1]!] = parseYamlScalar(nestedMatch[2] ?? '')
        }
        const keys = Object.keys(nestedMap)
        if (keys.length > 0) for (const nestedKey of keys) out[`${key}.${nestedKey}`] = nestedMap[nestedKey]!
        else out[key] = nested
      } else {
        out[key] = ''
      }
      index = collected.next
      continue
    }
    out[key] = parseYamlScalar(rest)
    index += 1
  }
  return out
}

/** Result of splitting a `SKILL.md` document. */
export interface ParsedSkillMarkdown {
  frontmatter: Frontmatter
  body: string
  hasFrontmatter: boolean
}

/** Split YAML frontmatter from a Markdown body. */
export function parseSkillMarkdown(text: string): ParsedSkillMarkdown {
  const normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').replace(/^\uFEFF/, '')
  const lines = normalized.split('\n')
  if (lines.length === 0 || lines[0]!.trimEnd() !== '---') {
    return { frontmatter: {}, body: normalized, hasFrontmatter: false }
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === '---')
  if (end < 0) return { frontmatter: {}, body: normalized, hasFrontmatter: false }
  const block = lines.slice(1, end).join('\n')
  const body = lines.slice(end + 1).join('\n').replace(/^\n/, '')
  return { frontmatter: parseFrontmatterBlock(block), body, hasFrontmatter: true }
}

/** Read a frontmatter string by key (number/boolean values stringified). */
export function frontmatterString(frontmatter: Frontmatter, key: string): string | undefined {
  const value = frontmatter[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

/** Read a frontmatter boolean by key. */
export function frontmatterBoolean(frontmatter: Frontmatter, key: string): boolean | undefined {
  const value = frontmatter[key]
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return undefined
}
