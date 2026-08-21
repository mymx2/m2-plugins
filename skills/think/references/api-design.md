# API & Interface Design: Contract-First, Hard to Misuse

Load when the plan designs APIs, module boundaries, component props, or any public interface where one piece of code talks to another.

## Core Principles

- **Contract first.** Define the interface before implementing it; the contract is the spec. Types are the documentation.
- **Hyrum's Law.** With enough users, every observable behavior becomes a de facto contract — including quirks, error-message text, timing, and ordering. Be intentional about what you expose; don't leak implementation details; plan for deprecation at design time. Contract tests are not enough: even with perfect tests, a "safe" change can break real users who depend on undocumented behavior.
- **One-Version Rule.** Design for one version at a time — extend rather than fork, to avoid diamond-dependency problems.
- **Consistent error semantics.** Pick one strategy (HTTP status + structured error body) and use it everywhere; don't mix throw / return-null / return-`{error}`.
- **Validate at boundaries only.** Trust internal code; validate at system edges (API routes, form handlers, external-service responses, env loading). Third-party API responses are untrusted data — validate before use. Don't validate inside already-validated internal code.
- **Prefer addition over modification.** Extend interfaces with optional fields; never change field types or remove fields.
- **Predictable naming.** Plural-noun REST endpoints, camelCase query params/fields, `is/has/can` boolean prefixes, `UPPER_SNAKE` enums.

## Idempotency Keys

Accepting an `Idempotency-Key` is the contract; honouring it is the implementation. Key rules:

- **Derive the key from the intent, not the attempt** — stable across retries of one intent, different across distinct intents. Never `randomUUID()` per attempt or a timestamp.
- **Claim atomically** — a check-then-act (`SELECT` then `INSERT`) is a race; let a unique constraint pick the winner.
- **Guard the payload** — same key with a different body must fail loudly (422), not replay the first response.
- **Decide what an in-flight duplicate gets** (reject 409 / wait / return 202 + status URL) rather than letting the second caller through.
- **Every call has three outcomes: success, failure, and unknown.** Record the intent before calling out so a crash leaves evidence.
- **Set retention from the longest retry chain**, including dead-letter replay, not from disk cost.
- **"Our queue guarantees exactly-once" is an illusion** — the broker's ack and your side effect are not in one transaction. Design for at-least-once with idempotent processing.
- **Duplicate requests are correlated, not rare** — retries spike exactly when a dependency is degraded, which is when duplicates are most likely and most expensive.

## Red Flags

- Endpoints returning different shapes by condition; inconsistent error formats
- Validation scattered through internal code instead of at boundaries
- Breaking changes to existing fields; list endpoints without pagination
- Verbs in REST URLs
- An idempotency key derived from a UUID/timestamp; check-then-act claiming; same key with different body silently replayed
- API documentation or types not committed alongside the implementation
- A state-changing endpoint that neither honours an idempotency key nor is documented as unsafe to retry
