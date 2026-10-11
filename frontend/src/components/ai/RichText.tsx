import type { ReactNode } from 'react'

// Renders the Markdown that LLMs produce — paragraphs, "-", "*", "•", "–" and
// "1." lists, headings, tables, **bold**, *italic* and `code` — as React
// elements. No innerHTML is involved, so model output can never inject markup.

function inline(text: string): ReactNode[] {
  // Split on bold, inline code and italics, keeping the delimiters
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g).map((part, i) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.length > 2 && ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_')))) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

const splitRow = (line: string) =>
  line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

const isTableSeparator = (line: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim())

export default function RichText({ text, tone = 'light' }: { text: string; tone?: 'light' | 'dark' }) {
  const blocks: ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let para: string[] = []
  let table: string[][] | null = null

  const key = () => `b${blocks.length}`

  const flushPara = () => {
    if (para.length) blocks.push(<p key={key()}>{inline(para.join(' '))}</p>)
    para = []
  }
  const flushList = () => {
    if (list) {
      const items = list.items.map((it, i) => <li key={i}><span>{inline(it)}</span></li>)
      blocks.push(list.ordered ? <ol key={key()}>{items}</ol> : <ul key={key()}>{items}</ul>)
    }
    list = null
  }
  const flushTable = () => {
    if (table && table.length) {
      const [head, ...rows] = table
      blocks.push(
        <div key={key()} className="rt-table-wrap">
          <table>
            <thead><tr>{head.map((c, i) => <th key={i}>{inline(c)}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )
    }
    table = null
  }
  const flushAll = () => { flushPara(); flushList(); flushTable() }

  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim()

    // Tables: consecutive lines starting with "|"
    if (line.startsWith('|')) {
      flushPara(); flushList()
      if (!isTableSeparator(line)) (table ??= []).push(splitRow(line))
      continue
    }
    flushTable()

    if (!line || /^(-{3,}|\*{3,}|_{3,})$/.test(line)) { flushPara(); flushList(); continue }

    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      flushPara(); flushList()
      blocks.push(<p key={key()} className="rt-heading">{inline(heading[1].replace(/^\*\*|\*\*$/g, ''))}</p>)
      continue
    }

    const bullet = line.match(/^[-*•–]\s+(.*)$/)
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    if (bullet || numbered) {
      flushPara()
      const ordered = !!numbered
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] } }
      list.items.push((bullet ?? numbered)![1])
      continue
    }

    // A line that is only bold text ("**Best departure:**") reads as a sub-heading
    if (/^\*\*[^*]+\*\*:?$/.test(line)) {
      flushPara(); flushList()
      blocks.push(<p key={key()} className="rt-heading">{line.replace(/\*\*/g, '')}</p>)
      continue
    }

    flushList()
    para.push(line)
  }
  flushAll()

  return <div className={`rich-text${tone === 'dark' ? ' rich-text-dark' : ''}`}>{blocks}</div>
}
