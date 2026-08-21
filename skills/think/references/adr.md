# ADR: Record Decisions, Document the Why

Load when the plan makes a significant architectural decision that would be expensive to reverse (framework/library choice, data model, auth strategy, API architecture, build/hosting platform).

## When to Write an ADR

Choosing a framework/library/dependency; designing a data model; selecting an auth strategy; deciding API architecture; adding or changing a public API; shipping a feature that changes user-facing behavior; choosing build tools/hosting/infrastructure; any decision expensive to reverse.

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

## Why

The most valuable documentation captures the _why_ — context, constraints, and trade-offs. Code shows what was built; an ADR explains why it was built this way and what alternatives were considered. This prevents future engineers (and agents) from re-deciding the same question.

## Red Flags

- No ADRs in a project with significant architectural choices
- Deleting or rewriting an old ADR instead of superseding it with a new one
