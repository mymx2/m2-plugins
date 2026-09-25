# CI/CD & Quality Gates

Load when reviewing build/deploy pipeline changes, automated checks, or deployment strategies. CI/CD is the enforcement mechanism for every other skill — it catches what humans and agents miss, consistently on every change.

## Core Principles

- **Shift Left.** Catch problems as early as possible — a bug caught in linting costs minutes; the same bug in production costs hours. Move checks upstream.
- **Faster is Safer.** Smaller batches and more frequent releases reduce risk. A deploy with 3 changes is easier to debug than one with 30.

## The Quality Gate Pipeline

Every change passes lint → type check → unit tests → build → integration → (E2E) → security audit → bundle size before merge. **No gate can be skipped** — if lint fails, fix lint, don't disable the rule; if a test fails, fix the code, don't skip the test.

## Deployment Strategies

- **Preview deployments** — every PR gets a preview for manual testing.
- **Feature flags** decouple deployment from release: ship code without enabling it, roll back without redeploying, canary (1% → 10% → 100%), run A/B tests. Flag lifecycle: create → enable for testing → canary → full rollout → **remove the flag and dead code** (flags that live forever are debt — set a cleanup date).
- **Staged rollouts** — staging (auto) → production (manual/auto) → monitor for errors (15-min window) → roll back on errors.
- **Rollback plan** — every deployment must be reversible.

## Environment & Secrets

`.env.example` committed; `.env` never committed; `.env.test` committed (test environment, no real secrets); CI secrets in the secrets manager, not code. CI should never have production secrets.

## Automation Beyond CI

- Dependabot/Renovate for dependency updates.
- PR checks: required reviews, required status checks, branch protection (no force-push to main), optional auto-merge.

## Red Flags

- No CI; CI failures ignored or silenced; tests disabled to make the pipeline pass
- "The test is flaky, just re-run" — fix the flakiness; flaky tests mask real bugs and waste everyone's time
- Production deploys without staging verification; no rollback mechanism
- Secrets in code or CI config
- Long CI times with no optimization effort
