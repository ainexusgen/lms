# Deploying to lms.ottcode.com

Prereqs: DNS A record for lms.ottcode.com → 46.202.160.236 · Docker + Caddy on the server.

```bash
ssh root@46.202.160.236
git clone https://github.com/ainexusgen/lms.git /var/www/lms
cd /var/www/lms
cp .env.production.example .env.production   # then edit passwords if desired
./deploy.sh
```

Re-deploy after a code push: `cd /var/www/lms && ./deploy.sh`

- Postgres (Docker): host 127.0.0.1, port 5434, credentials in `.env.production`
- Backend API: 127.0.0.1:8050 (proxied at https://lms.ottcode.com/api/*)
- Frontend: 127.0.0.1:3050 (proxied at https://lms.ottcode.com)
- Reset demo data: `docker compose -f docker-compose.prod.yml down -v && ./deploy.sh`
