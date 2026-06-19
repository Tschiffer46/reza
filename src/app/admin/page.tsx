import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/family'
import { AdminFamilies } from '@/components/laga/AdminFamilies'
import { AdminUsers } from '@/components/laga/AdminUsers'
import { AdminFeedback } from '@/components/laga/AdminFeedback'

function relativeDate(d: Date): string {
  const diff = Date.now() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return 'idag'
  if (diff < 2 * day) return 'igår'
  if (diff < 7 * day) return `för ${Math.floor(diff / day)} dagar sedan`
  return d.toLocaleDateString('sv-SE')
}

export default async function AdminPage() {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch {
    notFound()
  }

  const [users, families, entries, cooks, familyRows, userRows, feedbackRows] = await Promise.all([
    prisma.user.count(),
    prisma.family.count(),
    prisma.entry.count(),
    prisma.changeLog.count({ where: { action: 'cooked' } }),
    prisma.family.findMany({
      include: { _count: { select: { members: true, entries: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, plan: true, isAdmin: true, bonusCredits: true, _count: { select: { memberships: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ])

  const stats = [
    { n: users, label: 'användare' },
    { n: families, label: 'gemenskaper' },
    { n: entries, label: 'recept' },
    { n: cooks, label: 'tillagningar' },
  ]

  return (
    <div style={{ minHeight: '100vh', maxWidth: 880, margin: '0 auto', padding: '28px 20px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Admin</h1>
        <Link href="/laga" style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>
          Till appen →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--card-bd)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)' }}>{s.n}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginBottom: 12 }}>Gemenskaper</h2>
      <AdminFamilies
        families={familyRows.map((f) => ({
          id: f.id,
          name: f.name,
          status: f.status,
          inviteCode: f.inviteCode,
          members: f._count.members,
          entries: f._count.entries,
        }))}
      />

      <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', margin: '28px 0 12px' }}>Användare</h2>
      <AdminUsers
        currentUserId={adminId}
        users={userRows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          plan: u.plan,
          isAdmin: u.isAdmin,
          bonusCredits: u.bonusCredits,
          families: u._count.memberships,
        }))}
      />

      <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', margin: '28px 0 12px' }}>Feedback</h2>
      <AdminFeedback
        items={feedbackRows.map((f) => ({
          id: f.id,
          type: f.type,
          message: f.message,
          status: f.status,
          email: f.email,
          date: relativeDate(f.createdAt),
        }))}
      />
    </div>
  )
}
