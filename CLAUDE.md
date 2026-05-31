# Reza — Receptsamling

## Projekt
Personlig receptsamlings-app för 2 användare. Klistra in text, screenshots eller ta foto av recept/tips — Claude AI extraherar strukturerad data som sparas i PostgreSQL med sök och filter.

**Live:** https://reza.agiletransition.se
**Repo:** https://github.com/tschiffer46/reza

## Stack
- **Next.js 15** (16.2.2) med App Router, TypeScript, Tailwind CSS 4
- **React 19** (19.2.4)
- **PostgreSQL 16** med Prisma 6 ORM
- **Anthropic SDK** — Haiku 4.5 för text, Sonnet 4 för bilder
- **Sharp** för bildresize (WebP, max 1200px)
- **Auth**: HMAC-signerad cookie via Web Crypto API (Edge-kompatibel, delat lösenord, ingen NextAuth)
- **PWA** med manifest.json och service worker

## Filstruktur
```
src/
├── app/
│   ├── page.tsx              # Startsida: lista + snabblänkar
│   ├── login/page.tsx        # Inloggning (delat lösenord)
│   ├── categories/page.tsx   # Hantera kategorier (CRUD)
│   ├── import/page.tsx       # Batch-import: klistra text → AI extraherar flera recept
│   ├── entry/
│   │   ├── new/page.tsx      # Nytt recept/tips (text/bild/URL → AI-extraktion)
│   │   ├── [id]/page.tsx     # Visa enskilt recept/tips
│   │   └── [id]/edit/page.tsx # Redigera
│   └── api/
│       ├── auth/route.ts       # POST login, DELETE logout
│       ├── categories/route.ts # GET lista, POST skapa, DELETE ta bort
│       ├── entries/route.ts    # GET lista (med sök/filter), POST skapa
│       ├── entries/[id]/route.ts # GET, PUT, DELETE enskild entry
│       ├── extract/route.ts    # POST AI-extraktion (text eller bild)
│       ├── extract/batch/route.ts # POST batch AI-extraktion (flera recept)
│       ├── upload/route.ts     # POST bilduppladdning (→ WebP)
│       └── images/[filename]/route.ts # GET servera uppladdad bild
├── components/
│   ├── CategoryFilter.tsx    # Filtrera efter kategori
│   ├── CookButton.tsx        # Räkna tillagningar
│   ├── EntryActions.tsx      # Redigera/ta bort-knappar
│   ├── EntryCard.tsx         # Kort i listan
│   ├── EntryForm.tsx         # Formulär för recept/tips
│   ├── EntryList.tsx         # Lista med entries
│   ├── ExtractPreview.tsx    # Förhandsgranska AI-resultat
│   ├── ImageUploader.tsx     # Kamera + galleri (separata knappar)
│   ├── LogoutButton.tsx      # Logga ut
│   ├── NavBar.tsx            # Navigering
│   ├── SearchBar.tsx         # Sökfält
│   └── ServiceWorker.tsx     # Registrera PWA service worker
├── lib/
│   ├── auth.ts               # HMAC-signerade sessioner, lösenordskontroll
│   ├── claude.ts             # Anthropic SDK: extractFromText + extractFromImage
│   ├── db.ts                 # Prisma singleton
│   ├── images.ts             # Sharp: saveImage, prepareForClaude, readImage, deleteImage
│   └── search.ts             # PostgreSQL fulltext-sök (svenska, tsvector + GIN)
└── middleware.ts              # Auth-kontroll på alla routes utom /login, /api/auth
```

## Databas
Två modeller i Prisma:
- **Entry**: recept eller tips med titel, kategori, ingredienser, instruktioner, bilder, tillagningsräknare
- **Category**: namn + typ (recipe/tip), seedas via `prisma/seed.ts`

Fulltext-sök implementerat med raw SQL: `search_vector` (tsvector) kolumn med GIN-index och trigger som uppdaterar vid INSERT/UPDATE. Använder `plainto_tsquery('swedish', ...)`.

## Konventioner
- Språk i UI: **Svenska**
- API-routes returnerar JSON
- Bilder sparas som WebP i `data/uploads/` (gitignored)
- Prisma client singleton i `src/lib/db.ts`
- Auth middleware i `src/middleware.ts`
- Kategorier (recept): Huvudrätt, Förrätt, Efterrätt, Bakning, Sallad, Soppa, Frukost, Snacks, Dryck
- Kategorier (tips): Matlagning, Förvaring, Kryddor, Redskap, Övrigt
- `output: 'standalone'` i next.config.ts för produktion
- Ingen NextAuth — enkel HMAC-cookie med Web Crypto API

## Kommandon
```bash
npm run dev              # Starta utvecklingsserver (port 3000)
npm run build            # Bygg för produktion (standalone)
npx prisma migrate dev   # Kör migrationer (utveckling)
npx prisma migrate deploy # Kör migrationer (produktion)
npx prisma db seed       # Seeda kategorier
npx prisma studio        # Databas-GUI
```

## Miljövariabler
Se `.env.example`:
```
DATABASE_URL=postgresql://reza:PASSWORD@localhost:5432/reza
REZA_PASSWORD=your-shared-password
SESSION_SECRET=generate-a-random-64-char-hex-string
ANTHROPIC_API_KEY=sk-ant-your-api-key
UPLOAD_DIR=./data/uploads
HOSTNAME=0.0.0.0    # Produktion
PORT=3456            # Produktion
```

## Deploy
- **Server**: Hetzner VPS (89.167.90.112), användare `deploy`
- **Process**: Systemd-tjänst (`reza.service`), körs som standalone Node.js
- **Proxy**: Nginx Proxy Manager (Docker, nätverk `hosting_web`, gateway `172.18.0.1`) → port 3456
- **DNS/CDN**: Cloudflare (SSL: Full) → reza.agiletransition.se
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`) — auto-deploy vid push till `main`
- **Nätverksregel**: `iptables -I INPUT -s 172.18.0.0/16 -p tcp --dport 3456 -j ACCEPT` (Docker→host)
  - **MÅSTE göras beständig** — annars försvinner regeln vid varje reboot och Nginx
    Proxy Manager kan inte nå appen → Cloudflare svarar **504 Gateway time-out**
    (visas som tom/svart sida i webbläsaren). Gör beständig med:
    ```bash
    sudo apt-get install -y iptables-persistent
    sudo netfilter-persistent save   # kör om efter varje ändring av regeln
    ```
  - **Felsökning av "tom/svart sida"**: testa lagren utifrån och in innan du rör koden.
    `curl -I https://reza.agiletransition.se/login` (504 = proxy/host, inte appen) →
    `ssh deploy@… 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3456/login'`
    (200 = appen är frisk, problemet ligger i iptables/NPM/Cloudflare, inte i bygget).
    Verifiera regeln med `sudo iptables -C INPUT -s 172.18.0.0/16 -p tcp --dport 3456 -j ACCEPT`
    (kräver `sudo` med fungerande tty, dvs `ssh -t`).
- **Manuell deploy**:
  ```bash
  cd ~/reza && git pull origin main && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && npm ci && npm run build && cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static && sudo systemctl restart reza
  ```

## Viktigt för AI-assistenter
- Läs AGENTS.md för Next.js-specifika regler
- Ändra inte auth-flödet utan att testa i Edge Runtime
- `search.ts` använder raw SQL — var försiktig med SQL injection (parametriserade queries)
- Bilder till Claude API resizas till 800px JPEG för att spara tokens
- Standalone build kräver att `public/` och `.next/static/` kopieras manuellt
