/** A small, dependency-free Markdown renderer that never injects raw HTML. */
import React from 'react'

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\n]+\*|_[^_\n]+_)/g

/** Only allow http(s) links; Markdown HTML is always rendered as text. */
function safeHref(raw: string): string | undefined {
  try {
    const url = new URL(raw, 'https://skillhub.cn')
    return url.protocol === 'http:' || url.protocol === 'https:' ? raw : undefined
  } catch {
    return undefined
  }
}

/** Render inline Markdown (bold, italic, code, links). */
function renderInline(text: string, keyPrefix: string, depth = 0): React.ReactNode[] {
  if (text === '') return []
  const nodes: React.ReactNode[] = []
  const parts = text.split(INLINE_PATTERN)
  parts.forEach((part, index) => {
    if (part === '') return
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      nodes.push(<strong key={key}>{renderInline(part.slice(2, -2), key, depth + 1)}</strong>)
      return
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      nodes.push(<strong key={key}>{renderInline(part.slice(2, -2), key, depth + 1)}</strong>)
      return
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      nodes.push(<code key={key}>{part.slice(1, -1)}</code>)
      return
    }
    if (part.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
      if (link !== null) {
        const href = safeHref(link[2] ?? '')
        if (href === undefined) nodes.push(<span key={key}>{link[1]}</span>)
        else nodes.push(<a key={key} href={href} target="_blank" rel="noreferrer noopener">{renderInline(link[1] ?? '', key, depth + 1)}</a>)
        return
      }
    }
    if ((part.startsWith('*') && part.endsWith('*') && part.length > 2) || (part.startsWith('_') && part.endsWith('_') && part.length > 2)) {
      if (depth < 3) {
        nodes.push(<em key={key}>{renderInline(part.slice(1, -1), key, depth + 1)}</em>)
        return
      }
    }
    nodes.push(<React.Fragment key={key}>{part}</React.Fragment>)
  })
  return nodes
}

/** Split a table row into cells. */
function splitRow(line: string): string[] {
  let value = line.trim()
  if (value.startsWith('|')) value = value.slice(1)
  if (value.endsWith('|')) value = value.slice(0, -1)
  return value.split('|').map(cell => cell.trim())
}

/** Whether a line is a Markdown table separator. */
function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line)
}

/** Whether a line starts a non-paragraph block. */
function startsBlock(line: string, next: string | undefined): boolean {
  return /^\s*```/.test(line)
    || /^#{1,6}\s+/.test(line)
    || /^\s*>\s?/.test(line)
    || /^\s*([-*+]|\d+[.)])\s+/.test(line)
    || /^\s*(---+|\*\*\*+|___+)\s*$/.test(line)
    || (line.includes('|') && next !== undefined && isTableSeparator(next))
}

/** Render Markdown blocks into React elements. */
function renderBlocks(lines: string[], keyPrefix: string, depth = 0): React.ReactNode[] {
  const blocks: React.ReactNode[] = []
  let index = 0
  let blockIndex = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''
    const next = lines[index + 1]
    const key = `${keyPrefix}-b${blockIndex++}`

    if (line.trim() === '') { index += 1; continue }

    const fence = /^\s*```([\w-]*)\s*$/.exec(line)
    if (fence !== null) {
      const code: string[] = []
      index += 1
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index] ?? '')) {
        code.push(lines[index] ?? '')
        index += 1
      }
      index += 1
      blocks.push(
        <pre key={key}>
          <code data-lang={fence[1] || undefined}>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading !== null) {
      const level = Math.min(6, (heading[1] ?? '#').length)
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      blocks.push(<Tag key={key}>{renderInline(heading[2] ?? '', key)}</Tag>)
      index += 1
      continue
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push(<hr key={key} />)
      index += 1
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = []
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? '')) {
        quote.push((lines[index] ?? '').replace(/^\s*>\s?/, ''))
        index += 1
      }
      blocks.push(
        <blockquote key={key}>
          {depth < 6 ? renderBlocks(quote, key, depth + 1) : <p>{quote.join(' ')}</p>}
        </blockquote>,
      )
      continue
    }

    if (line.includes('|') && next !== undefined && isTableSeparator(next)) {
      const header = splitRow(line)
      const rows: string[][] = []
      index += 2
      while (index < lines.length) {
        const rowLine = lines[index] ?? ''
        if (rowLine.trim() === '' || !rowLine.includes('|')) break
        rows.push(splitRow(rowLine))
        index += 1
      }
      blocks.push(
        <table key={key}>
          <thead>
            <tr>{header.map((cell, cellIndex) => <th key={`${key}-h${cellIndex}`}>{renderInline(cell, `${key}-h${cellIndex}`)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${key}-r${rowIndex}`}>
                {header.map((_, cellIndex) => (
                  <td key={`${key}-r${rowIndex}c${cellIndex}`}>{renderInline(row[cellIndex] ?? '', `${key}-r${rowIndex}c${cellIndex}`)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      )
      continue
    }

    const listItem = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (listItem !== null) {
      const ordered = /\d/.test(listItem[2] ?? '')
      const baseIndent = (listItem[1] ?? '').length
      const items: Array<{ text: string; indent: number }> = []
      while (index < lines.length) {
        const current = lines[index] ?? ''
        const match = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(current)
        if (match !== null) {
          items.push({ text: match[3] ?? '', indent: (match[1] ?? '').length })
          index += 1
          continue
        }
        if (current.trim() === '') { index += 1; break }
        if (/^\s+/.test(current) && items.length > 0) {
          const last = items[items.length - 1]
          if (last !== undefined) last.text += ` ${current.trim()}`
          index += 1
          continue
        }
        break
      }
      const Tag = ordered ? 'ol' : 'ul'
      blocks.push(
        <Tag key={key}>
          {items.map((item, itemIndex) => (
            <li
              key={`${key}-i${itemIndex}`}
              style={item.indent > baseIndent ? { marginLeft: Math.min(24, (item.indent - baseIndent) * 8) } : undefined}
            >
              {renderInline(item.text, `${key}-i${itemIndex}`)}
            </li>
          ))}
        </Tag>,
      )
      continue
    }

    const paragraph: string[] = [line]
    index += 1
    while (index < lines.length) {
      const current = lines[index] ?? ''
      if (current.trim() === '') break
      if (startsBlock(current, lines[index + 1])) break
      paragraph.push(current)
      index += 1
    }
    blocks.push(<p key={key}>{renderInline(paragraph.join(' '), key)}</p>)
  }

  return blocks
}

/** Render a Markdown document safely. */
export function Markdown({ source, className }: { source: string; className?: string }): React.ReactElement {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  return <div className={`shm-md${className === undefined ? '' : ` ${className}`}`}>{renderBlocks(lines, 'md')}</div>
}
