# 🍳 Reza — Receptsamling

En personlig receptsamlings-app för att spara recept och matlagnings-tips. Klistra in text, ta ett foto eller ladda upp en screenshot — Claude AI extraherar all information automatiskt.

**Live:** https://reza.agiletransition.se

## Funktioner

- **AI-extraktion** — Klistra in text eller ta foto → Claude extraherar recept/tips automatiskt
- **Batch-import** — Importera flera recept från en lång text på en gång
- **Fulltext-sök** — Sök på svenska med PostgreSQL tsvector
- **Kategorier** — Filtrera efter typ (recept/tips) och kategori, hantera kategorier
- **Bilder** — Ta foto med kamera eller välj från galleri, sparas som WebP
- **PWA** — Installera som app på mobilen
- **Tillagningsräknare** — Håll koll på hur ofta du lagar varje recept

## Tech Stack

| Lager | Teknik |
|-------|--------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API Routes (App Router) |
| Databas | PostgreSQL 16, Prisma 6 |
| AI | Anthropic SDK (Haiku 4.5 text, Sonnet 4 bilder) |
| Bilder | Sharp (WebP, resize) |
| Auth | HMAC-signerad cookie (Web Crypto API) |
| Deploy | Hetzner VPS, systemd, Nginx Proxy Manager, Cloudflare |
| CI/CD | GitHub Actions |

## Snabbstart (lokal utveckling)

### Förkrav
- Node.js 20+
- PostgreSQL 16+

### Steg

```bash
# 1. Klona och installera
git clone https://github.com/tschiffer46/reza.git
cd reza
npm install

# 2. Skapa .env (kopiera och fyll i)
cp .env.example .env

# 3. Skapa databasen
createdb reza  # eller via psql

# 4. Kör migrationer och seeda kategorier
npx prisma migrate dev
npx prisma db seed

# 5. Starta
npm run dev
```

Öppna http://localhost:3000 och logga in med lösenordet du satte i `.env`.

## Produktion (Hetzner VPS)

Se [BOOTSTRAP.md](BOOTSTRAP.md) för fullständig guide att sätta upp servern från scratch.

Kort version:
1. PostgreSQL + Node.js 20 på servern
2. Klona repo, skapa `.env.production`
3. `npm ci && npm run build`
4. Installera systemd-tjänst (`scripts/reza.service`)
5. Konfigurera Nginx Proxy Manager → port 3456
6. Cloudflare DNS (SSL: Full)
7. GitHub Actions deploy triggas automatiskt vid push till `main`

## Miljövariabler

| Variabel | Beskrivning |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REZA_PASSWORD` | Delat lösenord för inloggning |
| `SESSION_SECRET` | 64 tecken hex-sträng för HMAC |
| `ANTHROPIC_API_KEY` | Anthropic API-nyckel |
| `UPLOAD_DIR` | Sökväg för uppladdade bilder (default: `./data/uploads`) |
| `HOSTNAME` | `0.0.0.0` i produktion |
| `PORT` | `3456` i produktion |

## Projektstruktur

```
src/app/           Sidor och API-routes (Next.js App Router)
src/components/    React-komponenter
src/lib/           Delade bibliotek (auth, db, AI, bilder, sök)
prisma/            Schema, migrationer, seed
scripts/           Systemd-tjänst, setup-script
public/            PWA manifest, ikoner, service worker
data/uploads/      Uppladdade bilder (gitignored)
```

## Licens

Privat projekt.
