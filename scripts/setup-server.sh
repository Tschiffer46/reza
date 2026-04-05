#!/bin/bash
# Reza — Server setup script
# Run this once on the Hetzner server to set up the app.
#
# Usage: bash scripts/setup-server.sh

set -e

echo "=== Reza Server Setup ==="

# 1. Start PostgreSQL
echo "Starting PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 2. Create database and user
echo "Creating database..."
sudo -u postgres psql -c "CREATE USER reza WITH PASSWORD 'CHANGE_ME_TO_STRONG_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE reza OWNER reza;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER reza CREATEDB;" 2>/dev/null || true

# 3. Create upload directory
echo "Creating upload directory..."
mkdir -p ~/reza/data/uploads

# 4. Reminder for .env.production
echo ""
echo "=== MANUAL STEPS ==="
echo "1. Create ~/reza/.env.production with:"
echo "   DATABASE_URL=postgresql://reza:YOUR_PASSWORD@localhost:5432/reza"
echo "   REZA_PASSWORD=your-shared-password"
echo "   SESSION_SECRET=$(openssl rand -hex 32)"
echo "   ANTHROPIC_API_KEY=sk-ant-your-key"
echo "   UPLOAD_DIR=/home/\$USER/reza/data/uploads"
echo "   HOSTNAME=0.0.0.0"
echo "   PORT=3456"
echo ""
echo "2. Create systemd service:"
echo "   sudo cp ~/reza/scripts/reza.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable reza"
echo ""
echo "3. Run first deploy:"
echo "   cd ~/reza && npm ci && npx prisma migrate deploy && npx prisma db seed && npm run build"
echo "   sudo systemctl start reza"
echo ""
echo "Done!"
