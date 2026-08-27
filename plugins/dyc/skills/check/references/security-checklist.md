# Security Review Checklist

Load and work this checklist when reviewing code that touches user input, authentication/authorization, data storage, external integrations, file uploads, payments, PII, or LLM output. Treat every external input as hostile, every secret as sacred.

## Threat Model First

- [ ] Trust boundaries mapped: where does untrusted data cross in (requests, uploads, webhooks, third-party APIs, LLM output)?
- [ ] Assets named: credentials, PII, payment data, admin actions, money movement.
- [ ] STRIDE run per boundary (spoofing / tampering / repudiation / info disclosure / DoS / elevation).
- [ ] Abuse cases written next to use cases ("how would I misuse this?").

## Pre-Commit Checks

- [ ] No secrets in code (`git diff --cached | grep -i "password\|secret\|api_key\|token"`)
- [ ] `.gitignore` covers `.env`, `.env.local`, `*.pem`, `*.key`
- [ ] `.env.example` uses placeholders, not real secrets

## Security Handoff Gate (review → push / PR / release)

Distilled protocol for when a security review or scan runs inside a task that continues to a committed-code handoff (push, PR/MR, merge, release, deploy). Two separate user decisions — never merge them:

1. **Scan gate (before handoff).** If security review has not run yet and the next action is a handoff, offer it once: run the security review now, or skip and continue. A skip applies to the current commit set only; a newly created commit re-arms the gate. Do not persist skip state.
2. **Remediation gate (after findings).** Findings first, decision second. Present every finding with severity, CWE/category (when available), file:line, vulnerable snippet, remediation suggestion, and data-flow summary (when available) — then ask exactly: fix now, or continue without fixing. An earlier scan approval, handoff request, or prior "continue" never counts as fix approval.

Rules:

- **Never chain handoff commands.** `git add ... && git commit ... && git push` in one command is forbidden in this flow — it skips the gate. Commit first, then stop at the gate before any push/PR/merge/release/deploy command.
- **POST_FIX_HALT.** After approved fixes: report changed files, which findings were addressed, and verification results — then halt. Do not stage, commit, push, or resume the handoff until the user sends a new message after the fix summary. Fixing is never authorization to hand off.
- **Fail closed, stay silent.** If a security tool, its settings, or its output is unavailable or invalid, treat scanning as disabled: for an explicit security request, say it is unavailable and point to configuration; for an implicit handoff, continue without mentioning security. Never fabricate, embellish, or interpret findings — report only what the tool output or your own evidence shows.
- **Don't auto-shrink scope.** If a scan reports a scope or size limit, state the limit and stop; do not silently split, narrow, sample, or retry.

## Fast Signal Patterns (quick scan)

Cheap substring/regex sweeps worth running before a handoff when no scanner is configured. Scope rules with path filters (exclude tests, scripts, generated dirs) and keep regexes linear-time — reject catastrophic-backtracking shapes like `(a+)+` or `(a|a)+`:

| Pattern                                            | Signal                              | Severity    |
| -------------------------------------------------- | ----------------------------------- | ----------- |
| Substring: known prod key/token literals           | Hardcoded production credentials    | HIGH        |
| `cursor\.execute\(f["']` (or template-literal SQL) | String-formatted SQL — parameterize | HIGH        |
| `eval(` in request/handler code paths              | Code injection sink                 | MEDIUM-HIGH |

When sweeping whole repos, exclude `node_modules/`, `dist/`, `build/`, `.next/`, `vendor/`, `__pycache__/`, `.venv/`, `target/`, `*.min.js`, `*.lock`, and binary extensions (images, fonts, archives, media). Baseline scale limits: ~80KB per file, ~400KB total diff, ~30 files — beyond that, state the scope and get explicit direction instead of silently sampling.

## The Three-Tier Boundary System

- **Always:** validate all external input at the boundary; parameterize all queries; encode output (XSS); HTTPS; hash passwords (bcrypt >= 12 rounds / scrypt / argon2); security headers; httpOnly+secure+sameSite cookies; native dependency audit against the committed lockfile before release.
- **Ask first:** new auth flows; storing new sensitive data; new external integrations; CORS changes; file-upload handlers; rate-limit changes; elevated permissions.
- **Never:** commit secrets; log sensitive data; trust client-side validation; disable security headers; `eval()`/`innerHTML` with user data; sessions in client-accessible storage; expose stack traces.

## Authentication

- [ ] Passwords hashed with bcrypt (>= 12 rounds), scrypt, or argon2
- [ ] Session cookies `httpOnly`, `secure`, `sameSite: 'lax'`; session expiration configured
- [ ] Rate limiting on login (<= 10 attempts per 15 min); account lockout after repeated failures
- [ ] Password reset tokens time-limited (<= 1 hour) and single-use
- [ ] MFA supported for sensitive operations (optional, recommended)

## Authorization

- [ ] Every protected endpoint checks authentication
- [ ] Every resource access checks ownership/role (prevents IDOR)
- [ ] Admin endpoints require admin role verification
- [ ] API keys scoped to minimum permissions; JWT validated (signature, expiration, issuer)

## Input Validation

- [ ] All user input validated at system boundaries; use allowlists, not denylists
- [ ] String lengths, numeric ranges constrained; email/URL/date validated with proper libraries
- [ ] File uploads: type restricted, size limited, content verified (magic bytes)
- [ ] SQL queries parameterized; HTML output encoded
- [ ] URLs validated before redirect (no open redirect); server-side URL fetches allowlisted with private/reserved IPs blocked, incl. loopback and link-local `169.254.169.254` (cloud metadata, the #1 SSRF target) — and note the **TOCTOU gap**: the fetch resolves DNS again after the check, so a short-TTL record can rebind to an internal IP between validation and connection; high-risk surfaces resolve once and connect to the pinned IP, or sit behind a filtering agent

## Security Headers & CORS

- **Headers:** `Content-Security-Policy: default-src 'self'; script-src 'self'`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **CORS:** restrict to explicit origins; never `origin: '*'` in production.

## Data Protection & Privacy

- [ ] Sensitive fields excluded from API responses; sensitive data not logged
- [ ] PII encrypted at rest (if required); HTTPS everywhere; backups encrypted
- [ ] Personal data classified, collected against a stated purpose, minimized
- [ ] Retention limit and working deletion path (incl. backups/indexes); export/delete requests supported where required

## Dependency Security & Supply Chain

- [ ] Find the installation boundary (workspace root owning the lockfile); corroborate `packageManager`, lockfile, and CI; stop on disagreement
- [ ] Use the manager's frozen/immutable install (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`) and native audit (`npm audit`, `pnpm audit`, `yarn audit`)
- [ ] **Install-script gate:** never discover dependency scripts by first running an ordinary install. Bootstrap with scripts disabled or a documented default-deny policy; inspect exact script source and version before approval; record the narrowest native allow/deny policy and commit it; verify with a clean frozen install
- [ ] Triage audit findings by reachability; defer only with a reason and review date
- [ ] Never apply forced audit remediation automatically (`npm audit fix --force`); review remediation diffs and changelogs
- [ ] Verify registry signatures/provenance where supported
- [ ] Review new dependencies (ownership, maintenance, release age, provenance, transitive graph, typosquats)

## AI / LLM Features (if used)

- [ ] Model output treated as untrusted (never into `eval`/SQL/shell/`innerHTML`/file paths)
- [ ] Prompt injection assumed; permissions enforced in code, not the system prompt
- [ ] Secrets, cross-tenant data, and full system prompts kept out of the context window
- [ ] Tool/agent permissions scoped; destructive actions require confirmation
- [ ] Token, rate, and recursion limits set; RAG embeddings partitioned per tenant

## Error Handling

- [ ] Production errors are generic (no stack traces, SQL, or internals exposed to users)
