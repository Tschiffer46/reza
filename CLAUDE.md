# VadSkaVi — familjens receptbok

## Projekt
Familjereceptbok-PWA där hushåll/grupper ("gemenskaper") samlar recept och tips. Klistra in
text, screenshots eller foto — Claude AI extraherar strukturerad receptdata som sparas i
PostgreSQL med svensk fulltext-sök, betyg, kommentarer och tillagningslogg. Inloggning med
magic link eller e-post + lösenord.

**Live:** https://vadskavi.nu (app under `/laga`)
**Repo:** https://github.com/tschiffer46/reza (image: `ghcr.io/tschiffer46/vadskavi`)
**Mobil-app:** native iOS-app i separat repo `laga-app` (Expo) som konsumerar detta API via
Bearer-token — se **"Mobil-API"** nedan.

> Repot hette tidigare "reza" (en avvecklad POC). All kod här är VadSkaVi — appen ligger i
> repo-roten.

## Stack
- **Next.js 15** (App Router, `output: 'standalone'`), **React 19**, **TypeScript**
- **Tailwind CSS 4** (`@theme`-tokens + CSS-variabler) + **shadcn/ui**. Temat "Skandinaviskt
  kök": bg `#f6f5f1`, ink `#1a1a18`, accent terrakotta `#c75b39`, sage `#3f7d63`, typsnitt
  **Schibsted Grotesk** — speglar `laga-app/lib/theme.ts`. (Det gamla gröna temat med Georgia
  är borta sedan länge; `viewport.themeColor` var sista resten och är rättad.)
- **PostgreSQL 16** + **Prisma 6** ORM
- **Auth.js v5** (NextAuth) — JWT-sessioner + PrismaAdapter; Nodemailer magic link (SMTP/Mailcow)
  + Credentials (e-post + lösenord, bcryptjs)
- **Anthropic SDK** — Haiku 4.5 (text) / Sonnet 5 (bild) för receptextraktion
- **Sharp** för bildresize (WebP), **Wake Lock API** för lägescookning
- **Docker** (multi-stage, node:20-alpine) bakom **Nginx Proxy Manager**, **PWA** (manifest + SW)

## Filstruktur
```
src/
├── app/
│   ├── page.tsx                # Startsida: hero + appkort + principer (paraplyet)
│   ├── appar/                  # Marknadsföring per app (se "Publik yta" nedan)
│   │   ├── page.tsx            # Index med båda appkorten
│   │   └── [slug]/page.tsx     # EN mall för alla appar, SSG ur src/lib/apps.ts
│   ├── recept/                 # Publik SSG-receptbank (SEO + Adtraction)
│   ├── om/  kontakt/           # Om + principerna i löptext, kontaktuppgifter
│   ├── integritetspolicy/  anvandarvillkor/  cookiepolicy/  om-annonslankar/
│   ├── login/  register/  onboarding/   # Auth-flöde
│   ├── admin/page.tsx          # Admin: statistik + stäng/öppna gemenskaper
│   ├── laga/                   # Själva appen
│   │   ├── page.tsx            # Receptlista/feed
│   │   ├── entry/new · [id] · [id]/edit  # Skapa/visa/redigera recept
│   │   ├── family/page.tsx     # Hantera gemenskap (bjud in, byt, omslag)
│   │   ├── categories/page.tsx # Kategori-CRUD
│   │   ├── import/page.tsx     # Batch-import (AI extraherar flera recept)
│   │   └── profile/page.tsx    # Konto, plan/användning, lösenord
│   └── api/
│       ├── auth/[...nextauth]  register  onboarding  profile{,/password}
│       ├── mobile/login        # native-appens Bearer-inloggning (publik)
│       ├── entries{,/[id]}     entries/[id]/{comments,notes,rating,reactions}
│       ├── family{,/[id]}      family/{join,join-link,switch}  family/[id]/cover
│       ├── categories{,/[id]}  extract{,/batch}  upload  images/[filename]
│       └── admin/families/[id] # PATCH suspend/active
├── components/        # EntryForm, EntryCard, CookButton, ImageUploader …
│   ├── laga/          # AppShell, Feed, RecipeView, CookMode, FamilyView, AdminFamilies …
│   ├── marketing/     # AppCard, PrincipleCard, PhoneFrame, WaitlistForm
│   ├── PublicShell.tsx  SiteHeader.tsx  SiteFooter.tsx  ContentPage.tsx  ConsentBanner.tsx
│   └── ui/            # shadcn-primitiver (button, card, input)
├── lib/
│   ├── auth-email.ts  # canonicalUrl() + Nodemailer magic-link-mejl
│   ├── family.ts      # gemenskaps-helpers (se nedan) + requireUser/requireAdmin
│   ├── mobile-auth.ts # Bearer-token (HS256, AUTH_SECRET) för native-appen
│   ├── plan.ts        # FREE_MONTHLY_LIMIT, monthlyEntryCount
│   ├── search.ts      # svensk tsvector-sök (raw SQL)
│   ├── apps.ts        # APPREGISTRET — enda sanningskällan för vilka appar vi har
│   ├── site-copy.ts   # all copy för startsida/principer/footer (i18n-redo)
│   ├── site-config.ts # varumärke, företagsidentitet, 20 %-löftet, legalUpdated
│   ├── ai.ts  url-extract.ts  images.ts  categories.ts  laga.ts  db.ts  types.ts  utils.ts
├── auth.ts            # NextAuth-config (providers, callbacks, JWT)
└── middleware.ts      # auth-gate; PUBLIC_PATHS (/login,/register,/api/register,/api/mobile/login …) + Bearer-header för /api/*
prisma/schema.prisma   # datamodell (nedan)
scripts/setup-search.ts# idempotent: svensk tsvector-trigger + GIN-index + backfill
```

## Datamodell (Prisma)
- **User** — `email`, `name`, `avatar`, `password?`, `plan` (`free`/`paid`, default free),
  `isAdmin` (default false), `emailVerified`, `onboardedAt`. Relationer till memberships,
  recipes, ratings, notes, reactions, comments, changes + Auth.js Account/Session.
- **Family** ("gemenskap") — `name`, `inviteCode @unique`, `status` (`active`/`suspended`),
  `background?`, `coverImage?`. Har members (Membership), entries, categories.
- **Membership** — kopplar User↔Family, `role` (`member`/…), `@@unique([userId, familyId])`.
- **Entry** — recept/tips: `type`, `title`, `category`, `blurb?`, `time?`, `servings?`,
  `ingredients[]`, `instructions?`, `content?`, `drinks?`, `source?`, `url?`, `imageUrls[]`,
  `searchVector Unsupported("tsvector")?`, `timesCooked`, **`ratingAvg?`/`ratingCount`**
  (denormaliserat betygssnitt), `lastCooked?`, `familyId`, `creatorId`.
- **Rating** — `score` (1–6), `@@unique([entryId, userId])` (en röst/person, snittet skrivs
  tillbaka till Entry).
- **Note**, **Comment** — fritext per recept. **Reaction** — `@@unique([entryId, userId])`.
- **ChangeLog** — `action` (t.ex. `cooked`), `field?` — källa till "lagad av" + aktivitetsflöde.
- **Category** — `name`, `type` (`recipe`/`tip`), per familj.
- **Post** / **PostReply** — medlemssnack (anslagstavla) per gemenskap: `text`, `createdAt`.
  Inlägg göms/rensas efter 7 dagar (`SNACK_TTL_DAYS` i `src/lib/snack.ts`); betalande
  medlemmar kan ta bort andras inlägg/svar, alla sina egna.
- Auth.js: **Account**, **Session**, **VerificationToken**.

## Konventioner
- Språk i UI: **Svenska**. API-routes returnerar JSON.
- Prisma client singleton i `src/lib/db.ts`. Bilder som WebP i `data/uploads/` (gitignored;
  Docker-volym i prod).
- shadcn-komponenter under `src/components/ui/`; appspecifik UI under `src/components/laga/`.
- Tematokens i `src/app/globals.css` (`--ink`, `--muted`, `--accent`, `--card` …).

## Publik yta (vadskavi.nu utanför inloggningen)
Sajten bär **flera appar**, inte bara Laga. Startsidan är ett nav: hero → appkort →
principer → avsändare. Varje app har en egen sida under `/appar/<slug>`.

- **`src/lib/apps.ts` är enda sanningskällan.** Startsidan, `/appar`, `/appar/[slug]`,
  footern och sitemap läser alla därifrån. **Att lägga till app nummer tre = EN post i
  `apps`** — ingen ny route, ingen ny länklista. `/appar/[slug]` är en mall med
  `generateStaticParams()`, så nya appar blir statiska sidor automatiskt.
- **Copy hör hemma i `src/lib/site-copy.ts`**, inte i JSX. Sajten är svensk i dag men
  principerna pekar mot en publik utanför Sverige; ligger texterna samlade blir en engelsk
  version en syskonfil i stället för en jakt genom komponenterna.
- **De fyra principerna** (enkelhet, integritet, EU-drift, 20 % till välgörenhet) står
  kort på startsidan och i löptext på `/om`. **Håll dem kontrollerbara** — allt som påstås
  ska gå att granska mot hur apparna faktiskt fungerar. Att AI-tolkningen i Laga går via
  en amerikansk leverantör står uttryckligen på `/om` och på Laga-sidan; skriv inte bort
  det när texten putsas.
- **Receptbanken (`/recept`) är orörd** och länkas numera från Laga-sidan i stället för
  toppnavet. URL:erna och sitemap-posterna får inte ändras — Adtraction-godkännandet
  hänger på att innehållet ligger kvar.
- **Intresseanmälan:** `POST /api/waitlist` (publik) `{ app, email, company? }`. Sparas som
  en `Feedback`-rad utan `userId` (`type:'waitlist'`, `message` = appens namn) ⇒ **ingen
  schemaändring**, syns direkt i `/admin`. `company` är en honeypot; endpointen har
  e-postvalidering, dedupe per app+adress och en enkel takbegränsning i minnet.
  Ligger i `PUBLIC_PATHS` — utan det blir POST:en 307→/login och svarar 405.

### Färgsystem: huset vs apparna
`:root` i `globals.css` är **Laga-appens** palett och delas med `/laga` — ändra den inte
för marknadsföringens skull. Paraplyet har egna tokens (`--site-accent`, sage `#3f7d63`),
och varje app har en klass (`.theme-laga` / `.theme-gymma`) som sätts på kort och appsidor.

> **HÅRT LÄRT:** tema-klasserna måste sätta **`--color-app-*` direkt**, inte ett mellanled
> som `@theme` pekar på. Custom properties substitueras där de *deklareras* — med
> `--color-app-accent: var(--app-accent)` i `:root` låstes värdet till `:root`:s
> `--app-accent` och ärvdes ned oförändrat, så **båda apparna ritades i husets gröna**.
> `tsc`, `npm run build` och klass-genereringen var alla gröna; felet syntes först på en
> skärmbild. Titta på sidorna innan du litar på en färgändring.

## Mobil-API (native-appen `laga-app`)
Native iOS-appen kan inte hantera NextAuth:s HTTP-only-cookie, så den autentiserar med en
**Bearer-token** vid sidan av webbens cookie-session:
- **`POST /api/mobile/login`** (publik) — `{ email, password }` → `{ token, user, families,
  activeFamilyId }`. Samma bcrypt-kontroll som Credentials-providern i `src/auth.ts`.
- **`POST /api/mobile/apple`** (publik) — Sign in with Apple för native-appen. `{ identityToken,
  fullName?, email? }`. Verifierar Apples identityToken med **`jose`** (`createRemoteJWKSet` mot
  `appleid.apple.com/auth/keys` + `jwtVerify`): `iss=https://appleid.apple.com`, `aud=`appens
  **bundle-id** (`APPLE_APP_BUNDLE_ID`, default `nu.vadskavi.laga` — native använder bundle-id som
  `aud`, INTE webbens Apple-Services-ID), `exp`. **Find-or-create** speglar webbens Apple-provider
  (`allowDangerousEmailAccountLinking`): Apple-`Account`(provider=`apple`, providerAccountId=`sub`)
  → annars befintlig `User` med samma e-post (länkas) → annars nytt konto. Returnerar samma form som
  login (`signMobileToken` + `getDefaultFamily` + `getUserFamilies`). Namn/e-post kommer bara vid
  *första* inloggningen ⇒ appen skickar med dem då. "Dölj min e-post" ger relay-adress ⇒ nytt konto.
- **`src/lib/mobile-auth.ts`** — `signMobileToken` / `verifyMobileToken` / `getBearerUserId`.
  HS256-JWT signerad med befintliga `AUTH_SECRET` via `node:crypto`. **Statslös** (ingen
  DB-tabell), **ingen ny dependency**, **ingen schemaändring**, ingen ny server-env.
- **`requireUser()`** (`src/lib/family.ts`) provar Bearer först, faller annars tillbaka på
  cookie-sessionen ⇒ **alla** befintliga `/api/*`-routes funkar för appen utan per-route-ändring.
- **`getDefaultFamily()`** läser `x-family-id`-header för val av aktiv gemenskap (saknas den
  används första aktiva gemenskapen, precis som webbens cookie-fallback).
- **`src/middleware.ts`** — `/api/mobile/login` **och `/api/mobile/apple`** ligger i `PUBLIC_PATHS`;
  requests med `Authorization: Bearer` släpps förbi auth-grinden men **endast för `/api/*`** (sidor
  som `/laga`/`/admin` kan inte kringgås med en godtycklig header).
- **`jose`** är en explicit dependency (Apple-token-verifiering); var redan transitiv via next-auth.
  Optional env `APPLE_APP_BUNDLE_ID` överstyr förväntat `aud` (default `nu.vadskavi.laga`).
  Native Sign in with Apple kräver att capability:n är påslagen på App ID:t — det är ett **app-/EAS-
  steg** (se `laga-app/CLAUDE.md`), inte en server-/reza-ändring.
- **Bilder:** `/api/images/[filename]` kräver inloggning ⇒ appen skickar Bearer-token i
  `<Image>`-headern (`source={{ uri, headers }}`).
- **Kontoradering (App Store-krav):** `DELETE /api/profile` **anonymiserar** användaren
  (e-post → `raderad-<id>@borttagen.vadskavi.nu`, namn "Raderad användare", password/avatar/bio
  null) + raderar Accounts/Sessions/Memberships/Posts/Notes. Recept/kommentarer/betyg behålls
  attribuerade till den anonymiserade användaren. `requireUser()` spärrar kvarvarande statslösa
  tokens vars konto raderats (kollar e-postdomänen). Apple-tokens revokeras best effort via
  `src/lib/apple-revoke.ts` (env `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY`; utan env
  no-op) — `/api/mobile/apple` tar optionalt `authorizationCode` och sparar `refresh_token` på
  Apple-Account-raden för detta.
- **Lämna gemenskap:** `POST /api/family/[id]/leave` (raderar callerns membership).
- **Rapportera innehåll:** feedback-typen `report` (`POST /api/feedback`) — appens
  "Rapportera"-åtgärder; hanteras i admin-feedbackvyn.
- **RevenueCat-webhook:** `POST /api/revenuecat/webhook` (publik, kräver env
  `REVENUECAT_WEBHOOK_SECRET`, annars 503) speglar prenumerationshändelser → `User.plan`.
  Hemligheten skickas av RevenueCat som `Authorization`-header. Payloaden är **nästlad**
  (`{ api_version, event: { type, app_user_id, … } }`) och `app_user_id` ÄR vårt `User.id`
  (appen anropar `Purchases.logIn(user.id)`).
  **HÅRT LÄRT — rör inte revoke-listan:** bara `EXPIRATION` sätter `free`. `CANCELLATION`
  betyder i RevenueCat att autoförnyelsen stängts av, inte att access upphört — kunden har kvar
  sin betalda period. Samma för `BILLING_ISSUE` (Apple försöker igen) och `SUBSCRIPTION_PAUSED`
  (pausen börjar vid periodslut). Lägger man dem bland revoke-händelserna stängs betalande
  kunder av i förtid. Mappningen är utbruten som ren funktion (`mapWebhookEvent`) och täckt av
  `npm run test:webhook` — testet failar om regeln bryts.
- **Webb:** `/anvandarvillkor` (användarvillkor, publik + i footer/sitemap).

## Kommandon
```bash
npm install           # installerar + kör `prisma generate` (postinstall)
npm run dev           # utvecklingsserver (port 3000)
npm run build         # prisma generate + next build (standalone)
npm run start         # kör produktionsbygget
npm run db:push       # prisma db push — synka schema mot DB (INGA migrations)
npm run db:seed       # seeda standardkategorier
npm run db:search     # scripts/setup-search.ts (svensk tsvector-sök)
npm run test:url      # tester för länkextraktionen (rena funktioner, inget nät)
npx prisma studio     # databas-GUI
```

## Deploy
- **CI/CD:** `.github/workflows/deploy.yml` — push till `main` bygger Docker-imagen, pushar
  `ghcr.io/tschiffer46/vadskavi:latest`, SSH:ar till servern och kör `docker compose up -d
  vadskavi`, sedan `prisma db push` + `scripts/setup-search.ts`. `.github/workflows/ci.yml`
  kör typecheck + build på varje PR.
- **Server:** Hetzner VPS (89.167.90.112), användare `deploy`. Compose i
  `/home/deploy/hosting/docker-compose.yml`, secrets i `/home/deploy/hosting/.env.vadskavi`,
  internt nät `web` (=`hosting_web`), uploads-volym `vadskavi-uploads`. NPM → `vadskavi:3000`,
  domän `vadskavi.nu`. Engångs-setup: se `docs/SERVER-SETUP.md`.

## Viktig kunskap / gotchas (läs innan du börjar)
- **DB-migrering:** Vi använder **`prisma db push`**, INTE `prisma migrate`. Schemaändringar
  i `prisma/schema.prisma` deployas automatiskt vid push till main (deploy kör `db push` +
  `setup-search.ts`). Lägg inte till migrations-mappar.
- **Terminologi:** UI säger **"Gemenskap"**, men kod/routes/cookie/DB använder
  `family`/`familyId` (`/laga/family`, `/api/family`, cookie `vadskavi-active-family`).
  Ändra INTE de interna namnen — bara visningstexten.
- **Auth:** NextAuth v5 (JWT-strategi). Nya publika routes MÅSTE läggas i `PUBLIC_PATHS` i
  `src/middleware.ts` (annars 307→/login, t.ex. POST `/api/register` som blir 405). Den
  publika URL:en pinnas via `canonicalUrl()` (`src/lib/auth-email.ts`) + redirect-callback i
  `src/auth.ts`, annars genererar Auth.js `0.0.0.0`-länkar bakom NPM. Servern måste ha
  `AUTH_URL=https://vadskavi.nu` i `.env.vadskavi`. Native-appen autentiserar i stället med
  **Bearer-token** (se **"Mobil-API"** ovan) — `requireUser()` hanterar båda vägarna.
- **Roller (manuellt, ingen Stripe än):** `User.plan` = `free`/`paid` och `User.isAdmin`
  sätts via SQL eller i `/admin`-vyn. **Första admin utan SQL:** sätt
  `ADMIN_EMAILS=epost1,epost2` i `.env.vadskavi` — `requireAdmin` (`src/lib/family.ts`)
  släpper in dessa och befordrar dem till riktig DB-admin första gången. Gratis = max 3
  recept/månad (`FREE_MONTHLY_LIMIT` i `src/lib/plan.ts`). Premium-förmåner idag: obegränsat
  antal recept, byta gemenskapens omslagsbild, moderera medlemssnack.
  `Family.status='suspended'` blockerar åtkomst (admin stänger missbrukade gemenskaper).
  **På gång — RevenueCat-IAP (native-appen):** premium-köp i `laga-app` sätter `User.plan` via
  entitlement-sync (RevenueCat-webhook → `/api/revenuecat/webhook`, se ovan). `User.plan` fanns
  redan ⇒ ingen schemaändring. Serversidan är klar; appen väntar på SDK-inkoppling.
  Nuläge/design: `laga-app/docs/REVENUECAT-INTEGRATION-STATE.md`.
- **Länkextraktion (`src/lib/url-extract.ts`):** sociala plattformar har **egna spår** eftersom
  inläggssidan är en inloggningsvägg/JS-skal för server-anrop — det generella HTML-spåret ger då
  bara skräp. TikTok: oEmbed + sidans state-JSON. Instagram: den **publika embed-vyn**
  `instagram.com/p/<shortcode>/embed/captioned/` (inläggssidan själv går inte att skrapa;
  Instagrams oEmbed kräver Facebook-apptoken sedan 2020). Bärande princip: **misslyckad hämtning
  ska ge ett tydligt fel, aldrig ett tomt eller påhittat recept** — `normalizeEntry()` har fallback
  för varje fält, så utan `requireSubstance()` returneras ett välformat tomt recept som ser ut att
  ha lyckats. Kör `npm run test:url` efter ändringar; og-parsningen har ett regressionstest för
  apostrofer i attributvärden (ett `[^"']*` kapar bildtexten mitt i).
- **Härledd data:** "lagad av" + aktivitetsflöde härleds ur `ChangeLog`; betygssnitt
  denormaliseras till `Entry.ratingAvg/ratingCount` (uppdatera vid ny Rating).
- **Byggmiljö (Claude-session):** ingen Docker-daemon → verifiera med `npx tsc --noEmit` +
  `npm run build`; faktiskt DB-/runtime-test sker först efter deploy mot live.
- **Arbetssätt:** kör `tsc` + `build` före commit.
- **Branch/PR-arbetssätt (VIKTIGT — undvik föräldralösa commits):** Skapa en **ny branch per
  uppgift**, grenad från senaste `main` (eller aktuell integrationstipp om en oöppnad PR ännu
  inte mergats), och öppna draft-PR:en direkt. **Återanvänd ALDRIG en branch vars PR redan
  mergats** — då hamnar nya commits utan öppen PR. Ska du fortsätta efter en merge: gren om från
  uppdaterad `main`. Verifiera att en öppen PR finns för branchen innan du pushar mer.
- **Server-fällor:** GHCR-imagen måste vara **publik** (annars `docker login ghcr.io` på
  servern); en utgången ghcr-inloggning ger `denied` även för publika images → `docker
  logout ghcr.io`. Bilder kräver uploads-**volym** (annars försvinner de vid omdeploy).

## SQL-snuttar (admin/plan, körs mot DB)
```sql
-- Gör en användare betalande / admin:
UPDATE "User" SET plan = 'paid'   WHERE email = 'thomas@schiffer.se';
UPDATE "User" SET "isAdmin" = true WHERE email = 'thomas@schiffer.se';
-- Stäng/öppna en gemenskap (görs annars i /admin):
UPDATE "Family" SET status = 'suspended' WHERE "inviteCode" = 'XXXX';
```
