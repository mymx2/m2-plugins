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

Three disciplines make an agent-facing doc reliable rather than decorative:

- **Prompt the positive, not the negation.** Steering by prohibition drags the forbidden behavior into context and makes it more available, not less ("don't think of an elephant"). State the target behavior — "write one-line comments" — so the banned one is never spoken. A prohibition earns its place only as a hard guardrail you cannot phrase positively, and even then pair it with the positive target.
- **Don't cache what the environment already says.** A doc that restates `package.json` scripts, config files, or `--help` output is a cache: a copy of a lookup that goes stale. Write only what the agent cannot find by looking — the unwritten convention, the reason behind a choice, the gotcha no config confesses.
- **Hunt no-ops sentence by sentence.** An instruction the model already obeys by default pays context load to say nothing. The test is whether deleting the sentence changes behavior; if not, delete the whole sentence rather than trim words from it.
- **Ground every concept before a block leans on it.** A reader loses the thread the moment a paragraph reaches for a concept they haven't met — whether or not jargon is involved, since the unit is the idea, not the term. Establish a concept (as a stated prerequisite, or by an earlier block) before any later block builds on it, and keep a running sense of what's grounded. Demand too much up front and you shut readers out; ground too much inside and the opening drowns in definitions. This applies to tutorials, specs, and any doc that builds an argument in order.

## Red Flags

- Architectural decisions with no written rationale; public APIs with no docs/types
- README that doesn't explain how to run the project
- Commented-out code instead of deletion; stale TODO comments
- Documentation that restates code instead of explaining intent

## Note

ADRs (Architecture Decision Records) are covered separately in the `think` skill's adr reference — this reference handles the documentation mechanics.
