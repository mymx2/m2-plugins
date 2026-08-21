# Documentation & ADRs

Load when writing or reviewing project documentation, README structure, changelogs, or inline comments. Document the _why_, not just the _what_.

## Inline Documentation

- **Comment the why, not the what.** "// Rate limit uses a sliding window…" (intent) beats "// Increment counter by 1" (restates the code). Comments on _why_ are stable; comments on _what_ go stale — that is why you only write the former.
- **Don't comment self-explanatory code**, don't leave TODO comments for things you should just do now, and don't leave commented-out code (delete it — git has history).
- **Document known gotchas** inline where they matter, with a pointer to the ADR.

## API Documentation

Inline with types (preferred): param/return/throws/example. For REST APIs, an OpenAPI/Swagger spec. Public APIs need docs or types shipped alongside the implementation. APIs stabilize faster when you document them — the doc is the first test of the design, so "we'll write docs when the API stabilizes" inverts the causality.

## README Structure

One-paragraph description, then: Quick Start, Commands (table), Architecture (link to ADRs), Contributing.

## Changelog

Curated, grouped `Added/Changed/Fixed/Deprecated/Removed/Security`, newest on top, phrased around user impact — not `git log`. Write the entry with the change, while the impact is fresh.

## Documentation for Agents

CLAUDE.md/rules files document conventions so agents follow them; specs kept updated so agents build the right thing; ADRs help agents understand why past decisions were made (prevents re-deciding); inline gotchas prevent known traps.

## Red Flags

- Architectural decisions with no written rationale; public APIs with no docs/types
- README that doesn't explain how to run the project
- Commented-out code instead of deletion; stale TODO comments
- Documentation that restates code instead of explaining intent

## Note

ADRs (Architecture Decision Records) are covered separately in `think/references/adr.md` — this reference handles the documentation mechanics.
