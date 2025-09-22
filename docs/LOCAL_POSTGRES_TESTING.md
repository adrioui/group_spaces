# Local PostgreSQL Testing Guide

Use a local PostgreSQL database with Drizzle for fast, isolated tests. This repo targets PostgreSQL (see `drizzle.config.ts`).

## Option A — Dockerized Postgres (recommended)
- Start Postgres:
  - `docker run --name gs-postgres -e POSTGRES_USER=dev -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=group_spaces_dev -p 5432:5432 -d postgres:16`
  - Create test DB: `docker exec -it gs-postgres psql -U dev -c "CREATE DATABASE group_spaces_test;"`
- Stop/cleanup when done:
  - `docker stop gs-postgres && docker rm gs-postgres`

## Option B — Native Postgres
- Install Postgres (macOS: `brew install postgresql@16`, Ubuntu: `sudo apt-get install postgresql`)
- Create user/dbs:
  - `createuser -s dev`
  - `createdb -U dev group_spaces_dev`
  - `createdb -U dev group_spaces_test`

## Environment Files
- `.env.local` (dev):
  - `DATABASE_URL=postgres://dev:dev@localhost:5432/group_spaces_dev`
- `.env.test` (tests):
  - `DATABASE_URL=postgres://dev:dev@localhost:5432/group_spaces_test`

## Migrate/Seed
- Dev:
  - `npm run db:migrate`
  - `npm run db:seed`
- Test (inject `.env.test`):
  - `env $(cat .env.test | xargs) npm run db:migrate`
  - Optional seed: `env $(cat .env.test | xargs) npm run db:seed`

## Run Tests Against Test DB
- Unit/Integration (Vitest): `env $(cat .env.test | xargs) npx vitest`
- E2E (Playwright):
  - `env $(cat .env.test | xargs) npm run build && npm start`
  - `npx playwright test`

## Isolation Strategy
- Fast: TRUNCATE app tables between tests.
- Safer: drop/recreate `group_spaces_test` per run, or use per-run schemas.

## Twilio/OTP in Tests
- Mock Twilio: `vi.mock('twilio')` in Vitest setup; assert SMS payloads.
- Dev-mode OTP: in non-production, log OTP and skip SMS send.

Notes
- Ensure user IDs are handled as text across APIs before integration tests.
- Drizzle is configured for PostgreSQL; no SQLite without changing dialect/schema.
