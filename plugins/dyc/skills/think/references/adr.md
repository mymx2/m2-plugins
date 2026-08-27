# ADR: Record Decisions, Document the Why

Load when the plan makes a significant architectural decision that would be expensive to reverse (framework/library choice, data model, auth strategy, API architecture, build/hosting platform).

## When to Write an ADR

Offer an ADR only when all three are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful.
2. **Surprising without context**: a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons.

If any is missing, skip it. A decision that's easy to reverse will just be reversed; one that isn't surprising needs no explanation; one with no real alternative is "we did the obvious thing," which is not worth a record.

What qualifies:

- **Architectural shape** — "the write model is event-sourced, the read model projected into Postgres."
- **Technology choices that carry lock-in** — database, message bus, auth provider, deployment target. Not every library, just the ones that would take a quarter to swap out.
- **Boundary and scope decisions** — "Customer data is owned by the Customer context; others reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path** — "manual SQL instead of an ORM because X." Anything a reasonable reader would assume the opposite of; these stop the next engineer "fixing" something deliberate.
- **Constraints not visible in the code** — "we can't use AWS because of compliance"; "responses must be under 200ms per the partner API contract."
- **Non-obvious rejected alternatives** — if you considered GraphQL and picked REST for subtle reasons, record it, or someone will suggest GraphQL again in six months.

## Match the Existing Convention First

Before creating an ADR, check the repo for an established convention (existing ADRs, project instructions, an `.adr-dir` file). Match location/format, numbering/naming, and section headings. If evidence conflicts, surface it rather than introducing a second scheme. Only when no convention exists do you use the default template, stored in `docs/decisions/` with sequential numbering (ADR-001, ADR-002, …).

## ADR Template

```
# ADR-001: [Title]

## Status
Accepted | Superseded by ADR-XXX | Deprecated

## Date
YYYY-MM-DD

## Context
[The problem and the requirements/constraints driving the decision]

## Decision
[What was chosen, in one clear statement]

## Alternatives Considered
[For each alternative: Pros / Cons / Why rejected]

## Consequences
[What this decision implies going forward]
```

## Lifecycle

`PROPOSED → ACCEPTED → (SUPERSEDED or DEPRECATED)`. **Don't delete old ADRs** — they capture historical context. When a decision changes, write a new ADR that references and supersedes the old one.

## Red Flags

- No ADRs in a project with significant architectural choices
- Deleting or rewriting an old ADR instead of superseding it with a new one
