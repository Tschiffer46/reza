# Reza — Bootstrap-guide

Den här guiden beskriver hur du återskapar hela Reza-appen på en ny maskin med Claude Code.

## Claude Code Bootstrap-prompt

Kopiera och klistra in detta i ett nytt Claude Code-samtal med repot klonat:

---

```
Jag vill sätta upp Reza (receptsamlings-app) i produktion på en ny server. Repot är redan klonat.

**Vad appen gör:**
Personlig receptsamling för 2 användare. Man klistrar in text, tar foto eller laddar upp screenshot — Claude AI (Haiku för text, Sonnet för bilder) extraherar strukturerad data (titel, ingredienser, instruktioner, kategori). Allt sparas i PostgreSQL med fulltext-sök på svenska.

**Stack:** Next.js 15 (standalone build), PostgreSQL 16, Prisma 6, Anthropic SDK, Sharp, Tailwind CSS 4.
**Auth:** Delat lösenord med HMAC-signerad session-cookie (Web Crypto API).

**Vad jag behöver hjälp med:**

1. **Servern (Ubuntu/Debian):**
   - Installera PostgreSQL 16 och Node.js 20 (via nvm)
   - Skapa databas-användare `reza` och databas `reza`
   - Skapa `.env.production` med alla miljövariabler (se .env.example)
   - Kör `npx prisma migrate deploy` och `npx prisma db seed`
   - Bygga appen: `npm ci && npm run build`
   - Kopiera standalone-filer: `cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static`
   - Installera systemd-tjänst från `scripts/reza.service`
   - Starta: `sudo systemctl enable --now reza`

2. **Reverse proxy:**
   - Appen lyssnar på port 3456 (HOSTNAME=0.0.0.0)
   - Konfigurera Nginx (eller NPM) att proxy:a till localhost:3456
   - Om Nginx körs i Docker: använd Docker-nätverkets gateway-IP (kolla med `docker network inspect`) och lägg till iptables-regel:
     `sudo iptables -I INPUT -s <docker-subnet> -p tcp --dport 3456 -j ACCEPT`
   - Gör regeln permanent: `sudo apt install iptables-persistent && sudo iptables-save | sudo tee /etc/iptables/rules.v4`

3. **DNS + SSL:**
   - Peka domänen mot serverns IP i Cloudflare
   - SSL-läge: Full (strict) i Cloudflare
   - Certifikat hanteras av Nginx/NPM (Let's Encrypt)

4. **CI/CD (GitHub Actions):**
   - Workflow finns i `.github/workflows/deploy.yml`
   - Sätt GitHub secrets: SERVER_HOST, SERVER_USER, SERVER_SSH_KEY
   - Deploy triggas automatiskt vid push till main

5. **Anthropic API:**
   - Skapa konto på console.anthropic.com
   - Lägg till credits ($5-15 räcker länge)
   - Skapa API-nyckel och lägg i .env.production som ANTHROPIC_API_KEY

Ge mig steg-för-steg instruktioner anpassade för min server.
```

---

## Manuell setup (steg för steg)

### 1. Förkrav på servern

```bash
# PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Node.js 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
```

### 2. Databas

```bash
sudo -u postgres psql
```

```sql
CREATE USER reza WITH PASSWORD 'STARKT_LÖSENORD_HÄR';
CREATE DATABASE reza OWNER reza;
ALTER USER reza CREATEDB;
\q
```

### 3. App-konfiguration

```bash
cd ~/reza

# Skapa .env.production
cat > .env.production << 'EOF'
DATABASE_URL=postgresql://reza:STARKT_LÖSENORD_HÄR@localhost:5432/reza
REZA_PASSWORD=lösenord-du-och-marina-delar
SESSION_SECRET=GENERERA_MED_openssl_rand_-hex_32
ANTHROPIC_API_KEY=sk-ant-din-nyckel-här
UPLOAD_DIR=/home/deploy/reza/data/uploads
HOSTNAME=0.0.0.0
PORT=3456
EOF

# Skapa upload-mapp
mkdir -p data/uploads

# Installera dependencies
npm ci

# Kör migrationer och seeda
set -a; source .env.production; set +a
npx prisma migrate deploy
npx prisma db seed

# Bygg
npm run build

# Kopiera static assets till standalone
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

### 4. Systemd-tjänst

```bash
# Redigera scripts/reza.service om sökvägar skiljer sig
sudo cp scripts/reza.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now reza

# Verifiera
sudo systemctl status reza
curl http://localhost:3456  # Ska ge 307 redirect till /login
```

### 5. Reverse proxy (Nginx Proxy Manager)

Om du kör NPM i Docker:

```bash
# Hitta gateway-IP för Docker-nätverket som NPM använder
docker network inspect <network_name> | grep Gateway
# Exempel: 172.18.0.1

# I NPM: skapa proxy host
#   Domain: reza.dindomän.se
#   Forward Hostname: 172.18.0.1 (gateway-IP från ovan)
#   Forward Port: 3456
#   SSL: Request new certificate (Let's Encrypt)

# Tillåt trafik från Docker till host
sudo iptables -I INPUT -s 172.18.0.0/16 -p tcp --dport 3456 -j ACCEPT

# Gör permanent
sudo apt install -y iptables-persistent
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

Om du kör vanlig Nginx:

```nginx
server {
    listen 443 ssl;
    server_name reza.dindomän.se;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Cloudflare DNS

1. Lägg till A-record: `reza` → serverns IP (proxy: orange moln)
2. SSL/TLS → Full (strict)

### 7. GitHub Actions (automatisk deploy)

Sätt dessa secrets i GitHub repo settings:

| Secret | Värde |
|--------|-------|
| `SERVER_HOST` | Serverns IP-adress |
| `SERVER_USER` | `deploy` (eller din användare) |
| `SERVER_SSH_KEY` | Privat SSH-nyckel (hela filen) |

Ge deploy-användaren sudoers för reza-tjänsten:

```bash
sudo visudo -f /etc/sudoers.d/deploy-reza
# Lägg till:
# deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart reza, /bin/systemctl stop reza, /bin/systemctl start reza, /bin/systemctl status reza
```

### 8. Anthropic API

1. Gå till https://console.anthropic.com
2. Lägg till credits (Billing → Add credits, $5-15 räcker länge)
3. Skapa API-nyckel **efter** att credits lagts till
4. Lägg nyckeln i `.env.production` som `ANTHROPIC_API_KEY`
5. Starta om: `sudo systemctl restart reza`

## Felsökning

| Problem | Lösning |
|---------|---------|
| 502 Bad Gateway | Kolla att appen körs: `sudo systemctl status reza` + `curl http://localhost:3456` |
| Timeout från NPM | Fel gateway-IP eller saknar iptables-regel |
| 401 invalid x-api-key | Kontrollera ANTHROPIC_API_KEY i .env.production |
| 400 credit balance too low | Skapa **ny** API-nyckel efter att credits lagts till |
| Inloggning fungerar ej | Kolla REZA_PASSWORD + SESSION_SECRET i .env.production |
| Bilder visas ej | Kolla att UPLOAD_DIR pekar rätt och att mappen finns |
| Sök hittar inget | Kör `npx prisma migrate deploy` — search_vector-trigger kan saknas |
