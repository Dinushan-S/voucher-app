# Gift Voucher System

A self-hosted gift voucher tool for small retail shops: generate secure single-use
vouchers, print them on A4 (3 per sheet) with your own branding, and redeem them
by scanning the QR code on a phone.

Built for a modern furniture showroom, but fully re-brandable from the admin UI —
shop name, address, phone and logo are all editable, no code changes needed.

**Stack:** SvelteKit · TypeScript · Supabase (Postgres) · Vercel

## Features

- **Batch generation** — any mix of LKR amounts and counts in one go, with an
  idempotency key so a double-click never creates two batches.
- **Print-ready sheets** — branded A4 layout with cutlines, shop details and QR codes;
  print or save as PDF.
- **Phone scanner** — camera scan shows green (valid) or red (invalid / expired /
  already redeemed), then redeems on confirm.
- **Race-safe redemption** — a single guarded `UPDATE`, so a voucher can never be
  redeemed twice, even with simultaneous scans.
- **Tamper-proof QR codes** — HMAC-signed tokens; forged codes are rejected before
  touching the database.
- **Custom branding** — set shop name, address, phone and upload a logo under
  *Shop Settings* in `/admin`. It flows through to the login page and printed vouchers.
- **Auto-expiry** — a daily cron marks lapsed vouchers as `expired`.
- Vouchers are single-use, full value only (no partial redemption).

## Quick start

### 1. Supabase

1. Create a project at https://supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_shop_settings.sql`.
3. From Project Settings → API, copy the **Project URL** and the **service_role** key
   (server-side only — never expose it).

### 2. Environment

Copy `.env.example` to `.env`:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...        # service_role key, server only
ADMIN_PASSCODE=...                   # the single operator passcode
SESSION_SECRET=...                   # long random string
QR_SECRET=...                        # long random string
VERIFY_BASE=https://your-app.vercel.app
CRON_SECRET=...                      # required in production for the expiry cron
```

Generate secrets with:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Run

```
npm install
npm run dev
```

Open http://localhost:5173 and unlock with your passcode. Then open **Shop Settings**
in `/admin` to set your own name and logo.

> The camera scanner needs HTTPS (or localhost). Over a LAN, use a Vercel preview
> URL or a tunnel — browsers block the camera on plain `http://<ip>`.

### 4. Deploy to Vercel

1. Push to a Git repo and import it in Vercel.
2. Add every variable from `.env` in the project settings (including `CRON_SECRET`).
3. Deploy. `vercel.json` registers a daily cron (18:00 UTC) that expires lapsed vouchers.

## API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/login` | Exchange passcode for a session cookie |
| POST | `/api/v1/auth/logout` | Clear session |
| POST | `/api/v1/vouchers/generate-batch` | Create a batch (send `Idempotency-Key` header) |
| POST | `/api/v1/verify` | Check a code (read-only) — green/red |
| POST | `/api/v1/redeem` | Atomically redeem a valid voucher |
| GET  | `/api/v1/settings` | Read shop branding (auth required) |
| POST | `/api/v1/settings` | Update shop name, address, phone, logo (auth required) |
| GET  | `/api/v1/cron/expire-vouchers` | Daily expiry sweep (requires `Bearer CRON_SECRET`) |

Example `generate-batch` body:

```json
{
  "expiry_date": "2027-06-30",
  "batches": [
    { "amount": 5000, "count": 20 },
    { "amount": 10000, "count": 10 }
  ]
}
```

## Security notes

- The `service_role` key and all secrets stay on the server.
- Non-public routes require the session cookie (see `src/hooks.server.ts`).
- QR codes carry an HMAC-signed token, verified before any DB lookup.
- Login and verify are rate-limited; failures are logged to `security_events`.
- The expiry cron fails closed: without `CRON_SECRET` it returns 401.
- Single-operator design: one passcode, one settings row — not multi-tenant.
