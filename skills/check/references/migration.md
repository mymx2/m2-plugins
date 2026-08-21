# Deprecation & Migration

Load when reviewing the removal of an old system, API, or feature, the migration of consumers from one implementation to another, or a database schema change. Code is a liability, not an asset — every line carries tests, patches, and onboarding cost, and Hyrum's Law makes removal hard: users depend on observable behavior the replacement may not replicate, so deprecation requires active migration, not just announcement.

## The Deprecation Decision

Before deprecating anything, answer five questions:

1. Does it still provide unique value? If yes, maintain it.
2. How many consumers depend on it? Quantify the migration scope.
3. Does a replacement exist? Never deprecate without a production-proven alternative.
4. What is the migration cost per consumer? Trivially automatable → do it; manual and high-effort → weigh against maintenance cost.
5. What is the ongoing cost of _not_ deprecating? Security risk, engineer time, complexity.

**Advisory vs compulsory.** Default to advisory (warnings, docs, nudges — users migrate on their own timeline). Compulsory (hard deadline) only when security or unsustainable maintenance cost justifies forcing migration — and it obliges you to provide migration tooling, documentation, and support.

**The Churn Rule.** If you own the infrastructure being deprecated, you are responsible for migrating your users — or for backward-compatible updates that require no migration. Don't announce and leave users to figure it out.

**Plan removal at design time.** Deprecation planning starts when the replacement is designed, not after it ships — "we'll deprecate it after we finish the new system" produces systems with no removal path. Design the new system with the old one's exit in mind.

## Migration Process

Build the replacement first → announce with a migration guide (status, replacement, removal date, reason, concrete steps) → migrate consumers one at a time (identify touchpoints, update, verify behavior matches, remove references) → remove the old system only after verified zero active usage (metrics, logs, dependency analysis), including its tests, docs, config, and the deprecation notices themselves.

## Migration Patterns

- **Strangler** — run old and new in parallel, route traffic incrementally (0% → 10% → 50% → 100%), remove the old system when it handles nothing.
- **Adapter** — translate the old interface onto the new implementation so consumers migrate on their own schedule.
- **Feature flag** — switch consumers one at a time behind a flag; same discipline as `references/ci-cd.md` flag lifecycle (owner, expiration, cleanup).

## Database Schema Migrations (Expand/Contract)

A schema change is the riskiest migration: data is the one thing a deploy revert cannot roll back. The failure mode is coupling schema change to code change — rename a column in the same release that starts using the new name, and during the rollout window one side queries a column that doesn't exist. **Never change a column in place**; migrate in additive phases so old and new code are both valid at every step:

1. **Expand** — add the new column nullable, deploy.
2. **Dual-write** — write both old and new on every insert/update, deploy.
3. **Backfill** — copy existing rows in throttled batches, off the hot path (a single `UPDATE` over millions of rows locks the table).
4. **Switch reads** — read the new column, keep writing both, deploy and bake.
5. **Contract** — stop writing the old column, then drop it in a _separate, later_ deploy.

Rules: additive first, destructive last and alone; every migration has a tested down path written and run _before_ merging; build large indexes without blocking writes (e.g. Postgres `CREATE INDEX CONCURRENTLY`); decouple risky cutovers with a feature flag. Treat each phase as a thin vertical slice per `references/incremental-guardrails.md`.

## Zombie Code

Code nobody owns but everybody depends on: no commits in 6+ months with active consumers, no maintainer, failing tests nobody fixes, unpatched vulnerable dependencies. It cannot stay in limbo — either assign an owner and maintain it properly, or deprecate it with a concrete migration plan.

## Red Flags

- Deprecation with no replacement, no migration tooling, or no usage measurement; "soft" deprecation advisory for years with no progress
- Removing code without verifying zero active consumers; new features added to a deprecated system
- A schema change and the code depending on it shipped in the same deploy; a column renamed or dropped in place; a migration merged with no tested down path; a backfill that locks the table
