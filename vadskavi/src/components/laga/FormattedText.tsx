import * as React from 'react'

/**
 * Renderar flerradig text med punkt-/numrerade listor och stycken. Rader som
 * börjar med -, *, • blir punktlista; "1." / "1)" blir numrerad lista; övrigt
 * blir stycken. Bevarar i övrigt radbrytningar.
 */
export function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []
  let numbers: string[] = []
  let key = 0

  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={key++} className="list-disc space-y-1 pl-5">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>,
      )
      bullets = []
    }
    if (numbers.length) {
      blocks.push(
        <ol key={key++} className="list-decimal space-y-1 pl-5">
          {numbers.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ol>,
      )
      numbers = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/)
    const number = line.match(/^\d+[.)]\s+(.*)$/)
    if (bullet) {
      if (numbers.length) flush()
      bullets.push(bullet[1])
    } else if (number) {
      if (bullets.length) flush()
      numbers.push(number[1])
    } else {
      flush()
      blocks.push(
        <p key={key++} style={{ color: 'var(--ink)', lineHeight: 1.55 }}>
          {line}
        </p>,
      )
    }
  }
  flush()

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15.5 }}>{blocks}</div>
}
