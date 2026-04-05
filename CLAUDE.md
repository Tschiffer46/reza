# Reza — Receptsamling

## Projekt
Personlig receptsamlings-app for 2 anvandare. Next.js 15 (App Router) + PostgreSQL + Prisma + Anthropic SDK.

## Stack
- **Next.js 15** med App Router, TypeScript, Tailwind CSS
- **PostgreSQL 16** med Prisma ORM
- **Anthropic SDK** — Haiku for text, Sonnet for bilder
- **Sharp** for bildresize
- **Auth**: HMAC-signerad cookie (delat losenord, ingen NextAuth)

## Filstruktur
- `src/app/` — sidor och API-routes
- `src/lib/` — db.ts, auth.ts, claude.ts, images.ts, search.ts
- `src/components/` — React-komponenter
- `prisma/` — schema och migrationer
- `data/uploads/` — uppladdade bilder (gitignored)
- `public/` — PWA manifest, ikoner, service worker

## Konventioner
- Sprak i UI: Svenska
- API-routes returnerar JSON
- Bilder sparas som WebP i data/uploads/
- Prisma client singleton i src/lib/db.ts
- Auth middleware i src/middleware.ts
- Kategorier: Huvudratt, Forratt, Efterratt, Bakning, Soppa, Frukost, Snacks, Dryck (recept) + Matlagning, Forvaring, Kryddor, Redskap (tips)

## Kommandon
- `npm run dev` — starta utvecklingsserver
- `npm run build` — bygg for produktion
- `npx prisma migrate dev` — kor migrationer
- `npx prisma db seed` — seeda kategorier
- `npx prisma studio` — databasgranssnitt

## Miljovariabler
Se `.env.example` for alla nodvandiga variabler.

## Deploy
GitHub Actions till Hetzner via SSH. Port 3456 bakom Nginx. Doman: reza.agiletransition.se via Cloudflare.
