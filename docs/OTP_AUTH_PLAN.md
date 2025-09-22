# OTP Authentication Implementation Plan (Better Auth)

This plan makes OTP via phone number the primary authentication flow using Better Auth’s `phoneNumber` plugin in a Next.js App Router app with Drizzle.

## 1) Goals and Non‑Goals
- Goals: Passwordless login via SMS OTP; secure, rate‑limited flows; smooth UX; consistent user ID usage; test coverage and observability.
- Non‑Goals: Social login, email OTP, or password auth.

## 2) Architecture Overview
- Server: `betterAuth` with `phoneNumber` plugin, Drizzle adapter, Twilio for SMS, routes at `/api/auth/**` via `toNextJsHandler`.
- Client: `createAuthClient` with `phoneNumberClient`, hooks `useSendOTP`, `useVerifyOTP`.
- Middleware: Protect all pages/APIs except `/api/auth/**`, `/sign-in`, `/sign-up`.
- Data: Better Auth `user`, `session`, `account`, `verification` tables; app tables reference `user.id` (text).

Sequence
1) Client calls `sendOTP(phone)` → server validates/normalizes phone → rate limit → Twilio SMS code.
2) Client calls `verifyOTP(phone, code)` → on success, Better Auth issues session cookie; create user if first‑time; redirect.

## 3) Prerequisites
- Env: `BETTER_AUTH_SECRET` (≥32 chars), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `NEXT_PUBLIC_BETTER_AUTH_URL`.
- Database for local/CI: use PGlite (embedded Postgres) instead of Docker Postgres for speed and isolation.
  - Add dependency: `@electric-sql/pglite`
  - Provide a dev/test toggle (e.g., `DB_DRIVER=pglite|postgres`).
- Library: `libphonenumber-js` for E.164 normalization; optional hCaptcha/Turnstile for production.
- Schema check: `src/db/schema.ts` fields `phoneNumber` (unique), `phoneVerified` (boolean). Ensure all app FKs to `user.id` are type text.

## 4) Backend Changes
- `src/lib/auth.ts`
  - Keep `emailAndPassword.enabled=false`.
  - In `phoneNumber({ sendOTP })`, add dev mode: if `NODE_ENV!=='production'`, log OTP instead of sending.
  - Normalize to E.164. Reject invalid numbers.
  - Add resend cooldown (e.g., 60s) and attempt limits (e.g., 5 per 10 min per phone/IP).
- Rate Limiting Middleware
  - Implement small server util using in‑memory Map for dev; use Redis in prod. Keys: `ip`, `phone`.
  - Enforce on `sendOTP` and `verifyOTP` routes (wrap handler or intercept pre‑call).
- Captcha (prod only)
  - Require valid token to call sendOTP; verify server‑side.
- User Provisioning Hook
  - After first successful verify, ensure user record exists with `phoneNumber` and `phoneVerified=true`.
  - If an email account exists for same person, decide merge policy (out of scope unless needed).

## 5) Frontend Changes
- Replace pages
  - `src/app/sign-in/page.tsx`: remove email/password; add phone input, Send OTP, then code entry (use `src/components/ui/input-otp.tsx`).
  - `src/app/sign-up/page.tsx`: same flow; optionally collect name after login.
- UX
  - E.164 helper/format hint; international selector if needed.
  - Resend countdown (60s); disabled resend button; accessible error states.
  - Loading states and success confirmation; redirect with `callbackUrl` from middleware.

## 6) Middleware & Server Usage
- `middleware.ts`
  - Keep allowlist for `/api/auth`, `/sign-in`, `/sign-up`.
  - Use `auth.api.getSession` and remove temp header hacks when stable.
- Standardize User ID Type
  - Many routes assume numeric IDs (`parseInt`). Change to text throughout (e.g., `src/app/api/spaces/route.ts`, `users/route.ts`, `notes/route.ts`, etc.). Update queries to use text IDs and remove `parseInt`.

## 7) Database & Migrations
- Audit all tables referencing `user.id`. Ensure column type is `text` with FK to `user.id`.
- Add unique constraint on `user.phoneNumber` (exists). Optionally add composite index on `(phoneVerified, phoneNumber)` for lookups.
- No OTP codes stored in app tables; rely on Better Auth `verification` table.
- PGlite usage
  - Local/CI: initialize an embedded PGlite instance per process (or per test worker) for isolation.
  - Apply migrations programmatically at startup using Drizzle migrator (PGlite driver), e.g., `migrate(db, { migrationsFolder: 'drizzle' })`.
  - Keep `drizzle.config.ts` dialect as `postgresql` (SQL is Postgres-compatible).

## 8) Security & Abuse Prevention
- Rate limits: e.g., sendOTP 5/min and 20/day per phone; 30/min per IP; verifyOTP 10/min per phone.
- Blocklist disposable or known abusive prefixes if applicable.
- Captcha before send in production.
- Redact PII in logs; only partial phone visible; do not log codes in prod.
- Short code lifetime (e.g., 5–10 minutes) and code length 6.

## 9) Testing Strategy
- Unit
  - Phone normalization; invalid formats; rate limiter boundaries; Twilio payload generation.
  - PGlite bootstrap utility: create/drop database directory, run migrations, expose `db` handle.
- Integration
  - Use PGlite for DB: spin up ephemeral instance per test file/worker; run migrations once; mock Twilio.
  - Hit `/api/auth/phone-number/send-otp` and `/verify-otp`; assert success and session cookie presence.
- E2E (Playwright)
  - Start app with `DB_DRIVER=pglite` (no external DB). Happy path and error states as before.
- Performance
  - Burst send tests to confirm limiter holds under load using a single PGlite instance; verify limits and stability.

## 10) Observability
- Structured logs for send/verify outcomes with correlation IDs.
- Metrics: counters for sent, delivered (if using delivery receipts), verified, failures, rate‑limited.
- Alerts on spikes/failures; dashboard in your APM/log tool.

## 11) Rollout Plan
- Feature flag: `OTP_ONLY=true`. Keep email/password hidden in prod; can re‑enable for emergency.
- Dev/CI use PGlite; staging/prod keep managed Postgres.
- Soft launch to internal users; monitor metrics and Twilio deliverability.
- Remove legacy password UI after stability window.
- Backout: toggle `OTP_ONLY=false` to restore old flow (if still present).

## 12) Developer Experience
- Update `.env.example` with all auth/Twilio vars and `NEXT_PUBLIC_BETTER_AUTH_URL`.
- Docs: add README section “OTP Auth” with local dev note: OTP printed to server logs.
- Scripts: add `npm run dev:otp` (starts app with dev OTP delivery) if desired.

## 13) Acceptance Criteria
- Users can authenticate using phone+OTP end‑to‑end; session persists; protected pages load.
- Rate limits and captcha prevent abuse; proper errors shown.
- All user ID handling uses text IDs; no `parseInt` on user IDs remains.
- Tests cover unit/integration/e2e happy and failure paths.
- Metrics and logs available; no secrets or codes logged in prod.

## 14) Milestones
- M1: Backend OTP config + dev delivery (2d)
- M2: Frontend OTP pages + UX (2d)
- M3: Rate limiting + captcha + observability (2–3d)
- M4: Migrate ID usage + route fixes + tests (3–4d)
- M5: Rollout, docs, cleanup (1–2d)

References in Repo
- Better Auth server: `src/lib/auth.ts`
- Better Auth Next handler: `src/app/api/auth/[...all]/route.ts`
- Client hooks: `src/lib/auth-client.ts`
- OTP UI building block: `src/components/ui/input-otp.tsx`
- Middleware: `middleware.ts`
- Drizzle schema: `src/db/schema.ts`
