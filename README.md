# UHF RFID Library Management System — Live Demo
**TechNexusGen** · Next.js frontend · Python (FastAPI) backend · PostgreSQL

A complete, runnable demo of the RFID library solution from the TechNexusGen proposal:
self-issue kiosk, 24×7 book drop, anti-theft security gate, entrance flap barrier,
public OPAC and a full staff console — with animated RFID simulators and seeded test data.

---

## Quick start (Docker — recommended)

Requires Docker Desktop (https://www.docker.com/products/docker-desktop/).

```bash
cd LMS
docker compose up --build
```

First run takes a few minutes (image downloads + npm/pip installs). Then open:

| URL | What it is |
|---|---|
| http://localhost:3020 | Animated demo landing page (start here) |
| http://localhost:3020/kiosk | Self-issue kiosk simulator |
| http://localhost:3020/bookdrop | Book drop return simulator |
| http://localhost:3020/gate | Security gate simulator |
| http://localhost:3020/entrance | Entrance flap barrier simulator |
| http://localhost:3020/opac | Public catalogue (OPAC) |
| http://localhost:3020/dashboard | Staff console |
| http://localhost:8020/docs | Backend API — interactive Swagger docs |

**Logins:** `admin / admin123` (administrator) · `librarian / lib123`

The database schema and demo data are created automatically on first boot.
To reset the demo data completely: `docker compose down -v && docker compose up`.

## Manual run (without Docker)

1. Postgres 14+: create user `lms` / password `lms123` and database `lmsdb`.
2. Backend: `cd backend && pip install -r requirements.txt` then
   `DATABASE_URL=postgresql://lms:lms123@localhost:5432/lmsdb uvicorn app.main:app --port 8000`
3. Frontend: `cd frontend && npm install && npm run dev` → http://localhost:3020

---

## 5-minute client demo script

1. **Landing page** (`/`) — the animated overview; every module is one click away.
2. **Entrance** (`/entrance`) — tap *Priya Nair* → barrier opens, attendance logged.
   Tap *Arjun Reddy* (suspended) → access denied.
3. **Kiosk** (`/kiosk`) — tap Priya's card, place 2–3 books on the pad, Borrow.
   Watch multi-tag read + receipt; note "security disarmed".
   Try a 4th book beyond her limit → the business rule blocks it with a clear message.
4. **Gate** (`/gate`) — carry an *issued* book through → silent. Add a *not-issued*
   book → red alarm, event logged.
5. **Book drop** (`/bookdrop`) — drop an overdue book → auto check-in, fine
   auto-calculated, security re-armed, reservation queue served.
6. **Dashboard** (`/dashboard`) — the alarm, entries, fines and loans you just
   created are all live in the stats, charts and activity feed.
7. **Settings** (`/settings`, as admin) — change *Fine per overdue day* or
   *Max books per kiosk transaction* and repeat step 3: rules apply instantly.

## What's covered (mapped to the proposal)

- Self-issue kiosk with multi-tag UHF read, member validation, loan limits, receipts
- Self book return with fine calculation, security re-arm, reservation queue
- RFID security gate with armed/disarmed security-bit logic and event log
- Entrance flap barriers with card validation and attendance analytics
- Catalog (RFID tags auto-generated per copy), members (cards auto-encoded)
- Circulation desk: issue, return, renew (with rules), reservations, fines
- Web OPAC with live availability
- Reports: circulation trends, footfall, top titles, category mix, overdue list
- Everything configurable at runtime: fines, loan days, renewals, kiosk limits,
  gate alarm, barrier timing, branding

## Architecture

```
Next.js 14 (3000) ──REST──► FastAPI (8000) ──SQL──► PostgreSQL 16 (5433)
   │  animated simulators        │  circulation engine + RFID event APIs
   └── staff console / OPAC      └── auto schema + seed on first boot
```

Simulator endpoints (`/api/rfid/*`) mirror what physical UHF readers would call,
so real hardware can replace the simulators without touching the business logic.

— TechNexusGen · support@technexusgen.com · technexusgen.com
