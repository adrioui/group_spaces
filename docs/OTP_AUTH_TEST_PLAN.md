# OTP Authentication Test Plan

Purpose: Validate OTP (phone) as the primary auth flow implemented with Better Auth, Drizzle, and Twilio, ensuring correctness, resilience, security, and a smooth UX.

## Scope
- In scope: `/api/auth/**` OTP send/verify, session issuance, middleware protection, user provisioning, rate limiting, logging/metrics.
- Out of scope: Email/password, social login.

## Environments
- Local dev/CI: prefer PGlite (embedded Postgres) for fast, hermetic tests. Start app/tests with `DB_DRIVER=pglite`.
- Optional parity runs against local/managed Postgres remain supported.
- Mock Twilio in all non‑prod environments; OTP printed to logs in dev.

## Test Data
- Phone numbers: valid E.164 (`+14155550100`), invalid formats, non‑E.164, international variants.
- Edge: reused phone, unverified phone, blocked prefixes (if any).

## Unit Tests (Vitest)
- Phone normalization: accepts E.164, rejects invalid; preserves country code.
- Rate limiter: per‑IP and per‑phone windows, cooldowns, daily caps.
- Dev OTP delivery: logs code in non‑prod; no Twilio calls.
- Twilio payload: formats `to` number, body template, handles client errors.
- Error mapping: invalid/expired code, too many attempts → friendly messages.

## Integration Tests (API + DB)
- DB backend: use PGlite per test worker or per suite. Run Drizzle migrations programmatically before tests begin.
- Send OTP: `POST /api/auth/phone-number/send-otp`
  - 200 for valid phone; 400 invalid; 429 when over limit; 401 if captcha missing in prod mode.
- Verify OTP: `POST /api/auth/phone-number/verify-otp`
  - 200 sets session cookie; creates user if first login and sets `phoneVerified=true`.
  - 400 wrong/expired code; 429 on repeated failures.
- Session: `GET /api/auth/session` returns user after verify; empty before.
- Middleware: access protected route without session → redirect to `/sign-in`; with session → 200.

## E2E Tests (Playwright)
- Start app with `DB_DRIVER=pglite` (no external DB required).
- Happy path sign‑in: enter phone → send OTP → enter code → redirected to `callbackUrl` → session persists on refresh.
- Sign‑up first‑time: phone verify → optional profile step → authenticated.
- Resend cooldown: resend disabled for 60s; then enabled.
- Errors: wrong code, expired code, rate‑limited send; assert clear, accessible errors.
- International format: non‑US phone accepted and verified.

## Security/Abuse
- Rate limiting: enforce per‑phone and per‑IP; verify headers/cookies can’t bypass.
- Captcha (prod): missing/invalid token blocks send.
- PII in logs: phone redacted; OTP codes never logged in prod.
- Session: HttpOnly, Secure, SameSite; logout clears session.

## Performance/Resilience
- Burst sends: 50 rapid send requests → limits applied; stable latency.
- Twilio outage: simulate provider error → 502/503 with actionable message.
- Cold start: first call after boot succeeds end‑to‑end.

## Observability
- Logs: send/verify attempts include correlation IDs; failures have reason codes.
- Metrics: counters for sent/verified/failed/rate‑limited; alerts on spikes/failures.

## Execution & Commands
- Unit/Integration (PGlite): `DB_DRIVER=pglite npx vitest`
- E2E (PGlite):
  - `DB_DRIVER=pglite npm run build && DB_DRIVER=pglite npm start`
  - `npx playwright test`
- Optional Postgres runs (parity): point `DATABASE_URL` and omit `DB_DRIVER=pglite`.

Notes
- Endpoints used are those exposed by Better Auth’s phone plugin: `/api/auth/phone-number/send-otp`, `/api/auth/phone-number/verify-otp`, `/api/auth/session`.
- Standardize user ID to text in APIs before running integration/E2E to avoid `parseInt` errors.
- See `docs/PGLITE_TESTING.md` for setup, migrations, and isolation strategies.
