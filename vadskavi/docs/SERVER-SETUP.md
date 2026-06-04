# VadSkaVi — server-setup (engångs)

Steg-för-steg för att förbereda Hetzner-servern (89.167.90.112) och få upp VadSkaVi
första gången. Allt körs i **Terminal på din Mac** via SSH som `deploy`. Efter detta
sköts uppdateringar automatiskt av GitHub Actions.

> **Förkrav:** SSH-åtkomst som `deploy`, och GitHub-secrets `SERVER_HOST`, `SERVER_USER`,
> `SERVER_SSH_KEY` finns redan i reza-repot (används av övriga appar).

```bash
ssh deploy@89.167.90.112
```

---

## 1. Frigör diskutrymme

```bash
docker image prune -f
df -h /
```

## 2. Skapa 2 GB swapfil

Servern har 3,7 GB RAM och ingen swap.

```bash
sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf
sudo sysctl -w vm.swappiness=10
free -h && swapon --show
```

---

## 3. Skapa secrets-filen `.env.vadskavi`

Servern använder en **per-app env-fil** (som `.env.stegvis`, `.env.forfor` …), inte inline
secrets i compose. Skapa den med autogenererade lösenord:

```bash
DBPASS=$(openssl rand -hex 24)
AUTHSECRET=$(openssl rand -base64 32)
cat > /home/deploy/hosting/.env.vadskavi <<EOF
NODE_ENV=production
DATABASE_URL=postgresql://vadskavi:${DBPASS}@vadskavi-db:5432/vadskavi
POSTGRES_PASSWORD=${DBPASS}
AUTH_SECRET=${AUTHSECRET}
AUTH_URL=https://vadskavi.nu
AUTH_TRUST_HOST=true
EMAIL_SERVER_HOST=mail.schiffer.se
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=noreply@vadskavi.nu
EMAIL_SERVER_PASSWORD=BYT_UT_MOT_SMTP_LOSENORD
EMAIL_FROM=VadSkaVi <noreply@vadskavi.nu>
ANTHROPIC_API_KEY=
EOF
chmod 600 /home/deploy/hosting/.env.vadskavi
```

Fyll sedan i SMTP-lösenordet (och ev. `ANTHROPIC_API_KEY` för AI-extraktion):

```bash
nano /home/deploy/hosting/.env.vadskavi   # ändra EMAIL_SERVER_PASSWORD-raden
```

Se [`../deploy/.env.vadskavi.example`](../deploy/.env.vadskavi.example) för alla nycklar.

---

## 4. Lägg till tjänsterna i docker-compose

Tjänsterna ligger på det interna `web`-nätet (samma som NPM och alla andra appar — Docker
döper det `hosting_web` utåt). Säkerhetskopiera filen först:

```bash
cp /home/deploy/hosting/docker-compose.yml /home/deploy/hosting/docker-compose.yml.bak
```

Klistra in `vadskavi`- och `vadskavi-db`-blocken från
[`../deploy/docker-compose.snippet.yml`](../deploy/docker-compose.snippet.yml) under
`services:`, och lägg `vadskavi_db_data:` under det översta `volumes:`-blocket.

> Tips: blocket finns redan på servern via reza-deployen — visa det med
> `cat ~/reza/vadskavi/deploy/docker-compose.snippet.yml`.

Du behöver **inte** lägga till något under `networks:` — `web` finns redan.

**Validera innan du startar något:**

```bash
cd /home/deploy/hosting
docker compose config >/dev/null && echo "compose OK"
```

---

## 5. Gör GHCR-paketet hämtbart

Imagen `ghcr.io/tschiffer46/vadskavi` är privat som standard. Enklast: **gör paketet
publikt** (imagen innehåller bara appkod, inga secrets):

GitHub → din profil → **Packages** → **vadskavi** → **Package settings** → Danger Zone →
**Change visibility** → **Public**.

> Alternativ (behåll privat): logga in servern mot GHCR med en PAT (scope `read:packages`):
> `echo DIN_TOKEN | docker login ghcr.io -u tschiffer46 --password-stdin`

**Fallgrop:** om en tidigare workflow lämnat en **utgången** `ghcr.io`-inloggning i
`~/.docker/config.json` får du `error from registry: denied` även för publika images. Kör
då:

```bash
docker logout ghcr.io
```

---

## 6. Starta tjänsterna

```bash
cd /home/deploy/hosting
docker compose pull vadskavi vadskavi-db
docker compose up -d vadskavi-db
docker compose up -d vadskavi
docker compose ps vadskavi vadskavi-db
docker compose exec -T vadskavi node node_modules/prisma/build/index.js db push
```

✅ *Förväntat:* båda `Up ... (healthy)` och `db push` klart ("in sync with your Prisma
schema"). Appen exponerar ingen host-port; healthchecken (i `docker compose ps`) visar att
den svarar internt på `:3000`.

(Valfritt) seeda standardkategorier för demo-familjen:
```bash
docker compose exec -T vadskavi node node_modules/tsx/dist/cli.mjs prisma/seed.ts
```

---

## 7. Proxy Host i Nginx Proxy Manager

NPM-admin (port 81) nås via SSH-tunnel från din Mac:

```bash
ssh -L 8081:localhost:81 deploy@89.167.90.112
# öppna http://localhost:8081
```

**Hosts → Proxy Hosts → Add Proxy Host:**
- Domain Names: `vadskavi.nu` (ev. även `www.vadskavi.nu`)
- Scheme: `http`
- Forward Hostname / IP: **`vadskavi`** (containernamnet — fungerar via `web`-nätet)
- Forward Port: **`3000`**
- ✅ Block Common Exploits, ✅ Websockets Support
- **SSL-fliken:** Request a new SSL Certificate (Let's Encrypt), ✅ Force SSL, ✅ HTTP/2

Säkerställ att DNS för `vadskavi.nu` (A-record) pekar på `89.167.90.112`.

---

## Klart 🎉

Öppna **https://vadskavi.nu** → inloggningssidan. Skriv din e-post → magic-link-mejlet
testar SMTP-kedjan end-to-end.

Framtida uppdateringar: pusha till `main` (ändringar under `vadskavi/**`) så bygger och
deployar GitHub Actions automatiskt (workflowen loggar in mot GHCR, pull:ar och kör
`db push`).
