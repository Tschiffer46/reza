import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Nodemailer from 'next-auth/providers/nodemailer'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendVerificationRequest, canonicalUrl, PUBLIC_BASE_URL } from '@/lib/auth-email'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT-sessioner krävs för Credentials-providern (magic link fungerar ändå via adaptern).
  session: { strategy: 'jwt' },
  // Appen körs bakom Nginx Proxy Manager; lita på proxy-host-headern.
  trustHost: true,
  pages: {
    signIn: '/login',
    verifyRequest: '/login?skickat=1',
  },
  providers: [
    // Social login. allowDangerousEmailAccountLinking länkar ihop samma (verifierade)
    // e-post med ett befintligt konto i stället för att skapa ett dubblettkonto.
    Google({ allowDangerousEmailAccountLinking: true }),
    Apple({ allowDangerousEmailAccountLinking: true }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60,
      sendVerificationRequest,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-post', type: 'email' },
        password: { label: 'Lösenord', type: 'password' },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? '').toLowerCase().trim()
        const password = String(creds?.password ?? '')
        if (!email || !password) return null
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    // Tvinga omdirigeringar till den publika adressen (annars kan 0.0.0.0:3000
    // läcka in bakom proxyn). Relativa url:er får basen; absoluta normaliseras.
    redirect({ url }) {
      return url.startsWith('/') ? `${PUBLIC_BASE_URL}${url}` : canonicalUrl(url)
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
