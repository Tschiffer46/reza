import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { Logo, Icon, AvatarStack } from '@/components/laga/ui'
import { displayName } from '@/lib/laga'

/**
 * Publik landningssida för inbjudningslänkar (sms:bara):
 *   vadskavi.nu/join/KOD
 * Inloggad → gå med direkt. Utloggad → välkomstvy med login/registrering som
 * tar användaren tillbaka hit efteråt.
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = decodeURIComponent(raw).trim().toUpperCase()

  const family = await prisma.family.findUnique({
    where: { inviteCode: code },
    include: {
      members: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { entries: true } },
    },
  })

  const session = await auth()
  if (session?.user?.id && family) {
    // Inloggad: gå med direkt (API:t sätter standardfamilj-cookien)
    redirect(`/api/family/join-link?code=${encodeURIComponent(code)}`)
  }

  const next = `/join/${encodeURIComponent(code)}`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <Logo size="lg" />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--card)',
          border: '1px solid var(--card-bd)',
          borderRadius: 'var(--radius)',
          padding: '28px 26px',
          textAlign: 'center',
        }}
      >
        {!family ? (
          <>
            <Icon name="x" size={34} color="var(--muted)" />
            <h1 style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '12px 0 8px' }}>
              Ogiltig inbjudan
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              Länken verkar inte stämma. Be om en ny inbjudningslänk, eller logga in och ange koden manuellt.
            </p>
            <Link
              href="/login"
              style={{ display: 'inline-block', marginTop: 20, background: 'var(--accent)', color: '#fff', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 600 }}
            >
              Till inloggningen
            </Link>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <AvatarStack people={family.members.map((m) => ({ name: displayName(m.user) }))} size={38} max={5} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Du är inbjuden till
            </div>
            <h1 style={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.025em', color: 'var(--ink)', margin: '6px 0 8px' }}>
              {family.name}
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              {family.members.length} {family.members.length === 1 ? 'medlem' : 'medlemmar'} · {family._count.entries} recept.
              Logga in eller skapa ett konto så hamnar du direkt i familjens receptbok.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                style={{ background: 'var(--accent)', color: '#fff', borderRadius: 12, padding: '13px 24px', fontSize: 15.5, fontWeight: 600 }}
              >
                Skapa konto & gå med
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                style={{ background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--card-bd)', borderRadius: 12, padding: '13px 24px', fontSize: 15.5, fontWeight: 600 }}
              >
                Jag har redan ett konto
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
