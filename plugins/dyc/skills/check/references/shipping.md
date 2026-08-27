# Shipping & Launch Readiness

Load for release-worthiness checks that complement the Release Gate 2.0 matrix in the `project-context` reference. Ship with confidence: deploys should be reversible, observable, and incremental.

## Pre-Launch Checklist (condensed)

**Code quality:** all tests pass; build clean; lint/type check pass; reviewed/approved; no stray `console.log` in production; error handling covers expected failure modes.

**Security:** no secrets in code/history; ecosystem audit shows no critical/high; input validated; auth checked; security headers; rate limiting on auth; CORS restricted. (See the `security-checklist` reference.)

**Performance:** Core Web Vitals within "Good"; no N+1 in critical paths; images optimized; bundle within budget; queries indexed; caching configured. (See the `performance-checklist` reference.)

**Accessibility:** keyboard nav works; screen reader conveys structure; color contrast ≥ WCAG AA (4.5:1 text); focus managed for modals/dynamic content. (See the `ui` skill's frontend-engineering reference.)

**Infrastructure:** env vars set; migrations ready; DNS/SSL/CDN configured; logging/error reporting configured; health-check endpoint responds.

**Documentation:** README updated; API docs current; ADRs written; changelog updated.

## Staged Rollout

Deploy to staging (full suite + smoke) → deploy to production behind a feature flag OFF → enable for team (24h window) → canary 5% (24–48h) → gradual 25/50/100 → full rollout (monitor 1 week, then clean up the flag — within 2 weeks of full rollout at the latest). Advance/hold/roll back on thresholds: error rate within 10% of baseline (advance), 10–100% above (hold), >2x (roll back); p95 latency within 20% (advance), 20–50% (hold), >50% (roll back); client JS errors no new types (advance), new errors <0.1% of sessions (hold), >0.1% (roll back); business metrics neutral or positive (advance), decline <5% (hold — may be noise), decline >5% (roll back).

Flag discipline: every flag has an owner and an expiration date; never nest feature flags (exponential combinations); test both flag states (on and off) in CI.

## Ship Decision: GO / NO-GO

For a release-gate verdict over a production-bound change, run the review dimensions in parallel when the agent facility allows (multiple fresh-context reviewers), then the main session merges them into a single verdict. Issue the parallel calls in one turn so they execute concurrently; keep the fan-out flat (personas never invoke other personas — see the `orchestration-patterns` reference). Skip the parallel fan-out only when the change touches 2 files or fewer, is under 50 lines, and does not touch auth, payments, data access, or config/env.

Output contract:

```markdown
## Ship Decision: GO | NO-GO

### Blockers (must fix before ship)

- [source + file:line]

### Recommended fixes (should fix before ship)

- [source + file:line]

### Acknowledged risks (shipping anyway)

- [risk + mitigation]

### Rollback plan

- Trigger conditions / procedure / recovery-time objective
```

Rules: the rollback plan is mandatory before any GO; if any reviewer returns a Critical finding, the default verdict is NO-GO unless the user explicitly accepts the risk; the merge happens in the main session, not inside a persona.

## Rollback

Every deployment needs a plan before it happens: trigger conditions (error rate >2x baseline, p95 > threshold, user reports, data integrity issues detected, security vulnerability discovered), steps (disable flag OR revert/deploy previous), DB considerations (migration rollback, data cleanup), and time-to-rollback targets (flag <1 min, redeploy <5 min, DB <15 min).

## Post-Launch (first hour)

Health endpoint 200; no new error types; latency normal; critical flow works manually; logs flowing; rollback mechanism verified.

## Red Flags

- Deploying without a rollback plan; no monitoring/error reporting
- Big-bang releases with no staging
- Feature flags with no owner/expiration
- "It's Friday afternoon, let's ship it"
