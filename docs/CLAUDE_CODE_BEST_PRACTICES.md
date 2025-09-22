# Claude Code Best Practices (Tailored for This Repo)

Purpose
- Provide a concrete playbook for implementing changes here with Claude Code.
- Optimize for small, reviewable diffs; clear intent; safe rollbacks; and fast verification.

Core Principles
- Plan before you code: write a short plan with goal, scope, risks, verification.
- Ship small diffs: one logical change per PR; avoid mixing refactors and behavior changes.
- Keep changes reversible: prefer localized edits and env-gated switches.
- Validate early/often: run targeted commands; attach logs/screenshots.
- Communicate clearly: describe what changed, why, and how to test.
- Respect runtime boundaries: Edge vs Node; test vs prod.

Conventional Commits
- Use descriptive scopes and imperative phrasing, e.g.:
  - fix(db): make db export ESM-safe
  - feat(test): add PGlite Vitest global setup
  - refactor(seeds): export pure seed functions
  - docs(pglite): add implementation checklist

Standard PR Template
- Title: Conventional Commit formatted.
- Context: Link to error/doc/ticket; include minimal logs.
- What/Why: Concise description of change and motivation.
- Plan: Bulleted list of exact edits (files/lines) and env gates.
- Verification: Commands to run, expected outputs; screenshots if UI/E2E.
- Rollback: How to revert and any cleanup.
- Follow‑ups: Next PRs to continue the work.

Change Management Checklist
- Pre-flight: `npm run lint`, reproduce current error (`npm run build` or failing tests`).
- Align with existing docs under `docs/`; if gaps exist, update docs first.
- Keep diff tight; avoid incidental formatting churn.
- Prefer env flags (e.g., `TEST_DB=pglite`) over global refactors.
- Keep production behavior unchanged unless requested.
- Update `.env.example` when adding env vars; never commit secrets.

Edge vs Node Boundaries
- Edge middleware must not import DB/Node-only modules directly.
- Use route handlers (Node runtime) for DB access; call them from Edge via fetch.
- Only import heavy/Node deps where they will run (server-only files).

Testing Strategy
- Unit/integration: start with smallest subset; expand as confidence grows.
- E2E: start with a smoke test and 1–2 critical flows; expand incrementally.
- DB tests: use deterministic, minimal seeds; reset/teardown consistently.

Operational Hygiene
- Keep package scripts aligned with docs.
- Keep `.env.example` in sync with configuration needs.
- Prefer logs that include context (env flags, modes) when debugging.

Approval & Iteration
- Solicit feedback early with small PRs.
- Be explicit about tradeoffs (e.g., static vs dynamic imports, test-only gates).
- Iterate based on review; avoid scope creep.

