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

## OWASP Top 10 Quick Reference

| #   | Vulnerability             | Prevention                                            |
| --- | ------------------------- | ----------------------------------------------------- |
| 1   | Broken Access Control     | Auth checks on every endpoint, ownership verification |
| 2   | Cryptographic Failures    | HTTPS, strong hashing, no secrets in code             |
| 3   | Injection                 | Parameterized queries, input validation               |
| 4   | Insecure Design           | Threat modeling first                                 |
| 5   | Security Misconfiguration | Security headers, minimal permissions, audit deps     |
| 6   | Vulnerable Components     | Native dependency audit, keep deps updated            |
| 7   | Auth Failures             | Strong passwords, rate limiting, session management   |
| 8   | Data Integrity Failures   | Verify updates/dependencies, signed artifacts         |
| 9   | Logging Failures          | Log security events, don't log secrets                |
| 10  | SSRF                      | Validate/allowlist URLs, restrict outbound requests   |

## OWASP Top 10 for LLMs Quick Reference

| ID    | Risk                             | Prevention                                              |
| ----- | -------------------------------- | ------------------------------------------------------- |
| LLM01 | Prompt Injection                 | Enforce permissions in code, not the system prompt      |
| LLM02 | Sensitive Information Disclosure | Keep secrets/PII out of prompts                         |
| LLM03 | Supply Chain                     | Vet models/data/plugins like any dependency             |
| LLM05 | Improper Output Handling         | Treat model output as untrusted; validate and encode    |
| LLM06 | Excessive Agency                 | Scope tool permissions; confirm destructive actions     |
| LLM07 | System Prompt Leakage            | Assume it can leak; no secrets in it                    |
| LLM08 | Vector/Embedding Weaknesses      | Partition RAG per tenant; validate docs before indexing |
| LLM10 | Unbounded Consumption            | Cap tokens, rate, and loop depth                        |
