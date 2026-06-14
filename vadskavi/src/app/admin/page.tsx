import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/family'
import { AdminFamilies } from '@/components/laga/AdminFamilies'

export default async function AdminPage() {
  try {
    await requireAdmin()
  } catch {
    notFound()
  }

  const [users, families, entries, cooks, familyRows] = await Promise.all([
    prisma.user.count(),
    prisma.family.count(),
    prisma.entry.count(),
    prisma.changeLog.count({ where: { action: 'cooked' } }),
    prisma.family.findMany({
      include: { _count: { select: { members: true, entries: true } } },
      orderBy: { createdAt: 'desc' },
    }),
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
    </div>
  )
}
