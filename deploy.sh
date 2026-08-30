#!/usr/bin/env bash
# One-shot deploy for lms.ottcode.com — run as root on the server.
set -euo pipefail

APP_DIR=/var/www/lms
REPO=https://github.com/ainexusgen/lms.git
DOMAIN=lms.ottcode.com

echo "==> 1/4 Fetching code"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production missing in $APP_DIR — create it first (see README-DEPLOY.md)"; exit 1
fi

echo "==> 2/4 Building & starting containers (db 5434, api 8050, web 3050 — localhost only)"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "==> 3/4 Configuring Caddy"
if ! grep -q "$DOMAIN" /etc/caddy/Caddyfile; then
  cat >> /etc/caddy/Caddyfile <<CADDY

$DOMAIN {
    encode gzip
    @api path /api/*
    handle @api {
        reverse_proxy localhost:8050
    }
    handle {
        reverse_proxy localhost:3050
    }
    tls schoolxgen@gmail.com
    log {
        output file /var/log/caddy/lms-access.log {
            roll_size 1mb
            roll_keep 4
            roll_keep_for 24h
        }
    }
}
CADDY
  systemctl reload caddy
  echo "    Caddy block added and reloaded"
else
  echo "    Caddy block already present — skipped"
fi

echo "==> 4/4 Health check"
sleep 5
curl -fsS http://127.0.0.1:8050/api/health && echo
echo
echo "DONE. Open https://$DOMAIN  (make sure the DNS A record points to this server)"
echo "Logins: admin/admin123 · librarian/lib123"
