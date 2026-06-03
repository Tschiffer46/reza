import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Nodemailer from 'next-auth/providers/nodemailer'
import { prisma } from '@/lib/db'
import { sendVerificationRequest } from '@/lib/auth-email'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Databassessioner — kräver Session/Account/VerificationToken-tabellerna i schemat.
  session: { strategy: 'database' },
  // Appen körs bakom Nginx Proxy Manager; lita på proxy-host-headern.
  trustHost: true,
  pages: {
    signIn: '/login',
    verifyRequest: '/login?skickat=1',
  },
  providers: [
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
      // 24 timmar
      maxAge: 24 * 60 * 60,
      sendVerificationRequest,
    }),
  ],
  callbacks: {
    // Exponera användar-id i sessionen (databassessioner ger `user` här).
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
