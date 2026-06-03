# VadSkaVi — server-setup (engångs)

Steg-för-steg för att förbereda Hetzner-servern (89.167.90.112) och få upp VadSkaVi
första gången. Allt körs i **Terminal på din Mac** via SSH som `deploy`. Efter detta
sköts uppdateringar automatiskt av GitHub Actions.

> **Förkrav:** du har SSH-åtkomst som `deploy`, och GitHub-secrets `SERVER_HOST`,
> `SERVER_USER`, `SERVER_SSH_KEY` finns redan i reza-repot (används av övriga appar).

```bash
ssh deploy@89.167.90.112
```

---

## 1. Frigör diskutrymme

Bara ~8,8 GB ledigt — rensa oanvända Docker-images först.

```bash
docker image prune -f
df -h /
```

---

## 2. Skapa 2 GB swapfil

Servern har 3,7 GB RAM och ingen swap. Lägg till 2 GB.

```bash
# Skapa och aktivera swap
sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Gör permanent över omstart
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Sänk swappiness (använd swap sparsamt)
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf
sudo sysctl -w vm.swappiness=10

# Verifiera
free -h
swapon --show
```

---

## 3. Lägg till tjänster i docker-compose

Öppna serverns compose-fil:

```bash
nano /home/deploy/hosting/docker-compose.yml
```

Klistra in `vadskavi`- och `vadskavi-db`-tjänsterna från
[`deploy/docker-compose.snippet.yml`](../deploy/docker-compose.snippet.yml) under
`services:`, lägg `vadskavi-db-data:` under `volumes:` och lägg till nätverken under
`networks:`.

**Verifiera nätverksnamnet** för Nginx Proxy Manager (snippet:en antar `hosting_web`):

```bash
docker network ls
```

Justera namnet i compose-filen om NPM ligger på ett annat externt nätverk.

### Lägg secrets i serverns `.env`

```bash
nano /home/deploy/hosting/.env
```

Lägg till (generera starka värden):

```bash
VADSKAVI_DB_PASSWORD=$(openssl rand -hex 24)
VADSKAVI_AUTH_SECRET=$(openssl rand -base64 32)
VADSKAVI_SMTP_PASSWORD=<SMTP-lösenordet för noreply@vadskavi.nu>
VADSKAVI_ANTHROPIC_API_KEY=<din Anthropic-nyckel, valfri nu>
```

> Tips: kör `openssl rand ...`-kommandona i terminalen och klistra in resultaten som
> statiska värden i `.env` (compose expanderar inte kommandon i filen).

---

## 4. Trigga första deployen

GitHub-secrets för SSH finns redan. Starta deployen så att imagen byggs och dras:

- **Antingen** pusha en ändring under `vadskavi/**` till `main`,
- **eller** kör workflowen manuellt: GitHub → Actions → **Deploy VadSkaVi** → *Run workflow*.

Workflowen bygger imagen, pushar till GHCR, och kör på servern:
`docker compose up -d vadskavi` + `prisma db push`.

Kontrollera på servern:

```bash
cd /home/deploy/hosting
docker compose ps vadskavi vadskavi-db
docker compose logs --tail=50 vadskavi
curl -sf http://127.0.0.1:3457/ >/dev/null && echo "OK: vadskavi svarar"
```

### (Valfritt) Seeda standardkategorier

```bash
docker compose exec -T vadskavi node node_modules/tsx/dist/cli.mjs prisma/seed.ts
```

---

## 5. Skapa Proxy Host i Nginx Proxy Manager

NPM-admin (port 81) är brandväggsblockerad — nå den via SSH-tunnel från din Mac:

```bash
ssh -L 8081:localhost:81 deploy@89.167.90.112
# öppna sedan http://localhost:8081 i webbläsaren
```

I NPM-admin:

1. **Hosts → Proxy Hosts → Add Proxy Host**
   - Domain Names: `vadskavi.nu` (och ev. `www.vadskavi.nu`)
   - Scheme: `http`
   - Forward Hostname / IP: `vadskavi` (containernamnet, samma nätverk)
     - *Om NPM ligger på ett annat nätverk:* använd host-IP `172.18.0.1` och port `3457`.
   - Forward Port: `3000` (eller `3457` om du går via host-IP)
   - ✅ Block Common Exploits, ✅ Websockets Support
2. **SSL-fliken**
   - Request a new SSL Certificate (Let's Encrypt)
   - ✅ Force SSL, ✅ HTTP/2, ange din e-post, godkänn villkoren
3. **Save**

Peka `vadskavi.nu` (DNS) mot serverns IP om det inte redan är gjort. Testa sedan
`https://vadskavi.nu` — du ska mötas av inloggningssidan.

---

## Klart 🎉

Framtida uppdateringar: pusha till `main` (ändringar under `vadskavi/**`) så bygger och
deployar GitHub Actions automatiskt.
