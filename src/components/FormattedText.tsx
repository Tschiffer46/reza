'use client'

/**
 * Renders text with basic formatting: preserves line breaks,
 * converts bullet lists (* or -) and numbered lists (1., 2., ...) to HTML.
 */
export function FormattedText({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text)

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === 'ul') {
          return (
            <ul key={i} className="list-disc list-inside space-y-1 my-2">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="list-decimal list-inside space-y-1 my-2">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ol>
          )
        }
        // Plain text block — preserve whitespace
        return (
          <p key={i} className={block.text ? 'whitespace-pre-wrap' : 'h-2'}>
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

type Block =
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'text'; text: string }

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Bullet list: starts with *, -, or •
    if (/^\s*[*\-•]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[*\-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[*\-•]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Numbered list: starts with digit(s) followed by . or )
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Collect consecutive plain text lines
    const textLines: string[] = []
    while (
      i < lines.length &&
      !/^\s*[*\-•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      textLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'text', text: textLines.join('\n') })
  }

  return blocks
}
