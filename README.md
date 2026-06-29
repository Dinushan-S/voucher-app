# Modern Furniture — Gift Voucher System

Single-operator voucher tool: generate secure single-use vouchers, print them
(3 per A4), and redeem them by scanning the QR at the showroom.

Stack: **SvelteKit + Supabase (Postgres) + Vercel**.

## What it does

- **Admin** (`/admin`) — enter any LKR amounts + counts, generate a batch.
- **Print** (`/admin/print/<batchId>`) — branded A4 sheets, print or save as PDF.
- **Scanner** (`/scan`) — phone camera scans the QR, shows green (valid) / red
  (invalid / expired / already redeemed), then redeems on confirm.
- Vouchers are **single-use, full value only** — no partial redemption.
- Redemption is **atomic** (race-safe): a single guarded `UPDATE`, so the same
  voucher can never be redeemed twice even under simultaneous scans.

## 1. Create the Supabase project

1. Create a project at https://supabase.com.
2. Open the SQL editor and run `supabase/migrations/0001_init.sql`.
3. From Project Settings → API, copy the **Project URL** and the
   **service_role** key (server-side only).

## 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...        # service_role key, server only
ADMIN_PASSCODE=...                   # the one operator passcode
SESSION_SECRET=...                   # long random string
QR_SECRET=...                        # long random string
VERIFY_BASE=https://your-app.vercel.app
```

Generate good secrets with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 3. Run locally

```
npm install
npm run dev
```

Open http://localhost:5173, unlock with your passcode.

> The camera scanner needs HTTPS (or localhost). On a phone over LAN, use the
> Vercel preview URL or a tunnel — browsers block camera on plain http://IP.

## 4. Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel.
2. Add all the env vars from `.env` in the Vercel project settings.
3. Add `CRON_SECRET` (any random string) so the daily expiry cron is protected.
4. Deploy. `vercel.json` registers the daily cron at 18:00 UTC that flips
   lapsed vouchers to `expired`.

## API summary

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/login` | Exchange passcode for a session cookie |
| POST | `/api/v1/auth/logout` | Clear session |
| POST | `/api/v1/vouchers/generate-batch` | Create a batch (send `Idempotency-Key` header) |
| POST | `/api/v1/verify` | Check a code (read-only) — green/red |
| POST | `/api/v1/redeem` | Atomically redeem a valid voucher |
| GET  | `/api/v1/cron/expire-vouchers` | Daily expiry sweep (Vercel Cron) |

### Generate-batch request

```json
{
  "expiry_date": "2027-06-30",
  "batches": [
    { "amount": 5000, "count": 20 },
    { "amount": 10000, "count": 10 },
    { "amount": 20000, "count": 5 }
  ]
}
```

## Security notes

- The `service_role` key and both secrets live only on the server.
- All non-public routes require the session cookie (see `hooks.server.ts`).
- QR codes embed an HMAC-signed token; forged QRs are rejected before any DB hit.
- Login and verify endpoints are rate-limited; failed attempts are logged to
  `security_events`.
