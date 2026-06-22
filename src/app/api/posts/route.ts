import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, getDefaultFamily } from '@/lib/family'
import { displayName } from '@/lib/laga'
import { parseMentions, snackCutoff } from '@/lib/snack'

/** Medlemmar i en gemenskap som {id, visningsnamn} — för @-omnämnanden. */
async function familyMembers(familyId: string): Promise<{ id: string; name: string }[]> {
  const members = await prisma.membership.findMany({
    where: { familyId },
    select: { user: { select: { id: true, name: true, email: true } } },
  })
  return members.map((m) => ({ id: m.user.id, name: displayName(m.user) }))
}

/** Skapa ett snack-inlägg i användarens standardgemenskap. */
export async function POST(request: NextRequest) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const familyId = await getDefaultFamily(userId)
  const { text } = await request.json()
  const t = String(text || '').trim()
  if (!t) {
    return NextResponse.json({ error: 'Skriv något' }, { status: 400 })
  }

  const mentions = parseMentions(t, await familyMembers(familyId)).filter((id) => id !== userId)
  const post = await prisma.post.create({
    data: { familyId, authorId: userId, text: t.slice(0, 2000), mentions },
  })
  return NextResponse.json({ id: post.id }, { status: 201 })
}

/**
 * Lista snack-inlägg (med svar) för användarens aktiva gemenskap. Speglar webbens
 * /laga/snack: rensar inlägg äldre än TTL, returnerar inom TTL (nyast först) och
 * nollställer oläst-bricka. Används av native-appen (Bearer + x-family-id).
 */
export async function GET() {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const familyId = await getDefaultFamily(userId)
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const canModerate = me?.plan === 'paid'

  const cutoff = snackCutoff()
  // Opportunistisk rensning av inlägg äldre än TTL (samma som webben, ingen cron).
  await prisma.post.deleteMany({ where: { createdAt: { lt: cutoff } } })

  const posts = await prisma.post.findMany({
    where: { familyId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, email: true, avatar: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { name: true, email: true, avatar: true } } },
      },
    },
  })

  const data = posts.map((p) => ({
    id: p.id,
    author: displayName(p.author),
    avatar: p.author.avatar,
    text: p.text,
    createdAt: p.createdAt.toISOString(),
    mine: p.authorId === userId,
    mentionsMe: p.mentions.includes(userId),
    replies: p.replies.map((r) => ({
      id: r.id,
      author: displayName(r.author),
      avatar: r.author.avatar,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
      mine: r.authorId === userId,
      mentionsMe: r.mentions.includes(userId),
    })),
  }))

  // Markera snack som sett → nollställer oläst-bricka (snack/unread jämför mot snackSeenAt).
  await prisma.user.update({ where: { id: userId }, data: { snackSeenAt: new Date() } })

  return NextResponse.json({ canModerate, posts: data })
}
