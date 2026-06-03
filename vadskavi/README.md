# VadSkaVi — familjens receptbok

Familjereceptbok-PWA. Next.js 15 (App Router, TypeScript), Tailwind 4 + shadcn/ui,
PostgreSQL via Prisma, inloggning med magic link (Auth.js v5 över SMTP).

**Live:** https://vadskavi.nu
**Repo-mapp:** `vadskavi/` (i [reza-repot](https://github.com/tschiffer46/reza))

> Ligger som undermapp i reza-repot men är en helt fristående Next.js-app med egen
> `package.json`, Docker-image (`ghcr.io/tschiffer46/vadskavi`) och databas (`vadskavi-db`).

## Stack
- **Next.js 15** (App Router, standalone), **React 19**, **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (grönt tema: header `#1C3A2B`, accent `#4CAF7D`, Georgia)
- **PostgreSQL 16** + **Prisma 6**
- **Auth.js v5** (NextAuth) — magic link via **Nodemailer/SMTP** (Mailcow)
- **Anthropic SDK** — förberett för AI-extraktion i senare sprintar
- **Docker** (multi-stage) bakom **Nginx Proxy Manager**

## Miljövariabler
Se [`.env.example`](./.env.example). Kopiera till `.env` och fyll i.

| Variabel | Beskrivning |
| --- | --- |
| `DATABASE_URL` | PostgreSQL-anslutning (`postgresql://vadskavi:…@vadskavi-db:5432/vadskavi`) |
| `AUTH_SECRET` | Auth.js-hemlighet. Generera: `openssl rand -base64 32` |
| `AUTH_URL` | Publik bas-URL, t.ex. `https://vadskavi.nu` |
| `AUTH_TRUST_HOST` | `true` bakom proxy (NPM) |
| `EMAIL_SERVER_HOST` | SMTP-host, `mail.schiffer.se` |
| `EMAIL_SERVER_PORT` | SMTP-port, `587` |
| `EMAIL_SERVER_USER` | `noreply@vadskavi.nu` |
| `EMAIL_SERVER_PASSWORD` | SMTP-lösenord (sätts på servern, committas aldrig) |
| `EMAIL_FROM` | Avsändare, `"VadSkaVi <noreply@vadskavi.nu>"` |
| `ANTHROPIC_API_KEY` | Anthropic-nyckel (används i senare sprintar) |

## Köra lokalt
```bash
cd vadskavi
cp .env.example .env          # fyll i värden (starta gärna en lokal postgres)
npm install
npx prisma db push            # skapa tabeller i din databas
npm run db:seed               # seeda standardkategorier (mall-familj)
npm run dev                   # http://localhost:3000
```

## Kommandon
```bash
npm run dev        # utvecklingsserver
npm run build      # prisma generate + next build (standalone)
npm run start      # kör produktionsbygget
npm run db:push    # prisma db push (synka schema mot DB)
npm run db:seed    # seeda standardkategorier
```

## Deploy & uppdatering
Deploy sker via GitHub Actions (`.github/workflows/vadskavi-deploy.yml`):

1. **Push till `main`** med ändringar under `vadskavi/**` (eller kör workflowen manuellt).
2. Workflowen bygger Docker-imagen, pushar till `ghcr.io/tschiffer46/vadskavi:latest`,
   SSH:ar till servern, kör `docker compose up -d vadskavi` och `prisma db push`.

**Första gången** måste servern förberedas manuellt (swapfil, compose-tjänster, NPM proxy
host). Följ [`docs/SERVER-SETUP.md`](./docs/SERVER-SETUP.md).

**Uppdatera** sedan genom att bara pusha till `main` — resten är automatiskt.
