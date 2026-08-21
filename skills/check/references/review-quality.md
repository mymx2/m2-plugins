# Review Quality: Five-Axis Review & Change Sizing

Load for any review to sharpen findings and structure. Complements the main review flow (which already covers scope, hard stops, and verification).

## The Five Axes

1. **Correctness** — does it match the requirements; edge cases (null/empty/boundary); error paths; tests actually testing the right things; off-by-one/race/state issues.
2. **Readability & simplicity** — descriptive consistent names; straightforward control flow; logical organization; abstractions earning their complexity (don't generalize until the third use case); no dead code artifacts (no-op vars, backwards-compat shims, `// removed` comments); a new conditional bolted onto an unrelated flow is a design smell, not a nit.
3. **Architecture** — fits existing patterns; clean module boundaries; no circular deps; **does the refactor reduce complexity or just relocate it?** (count the concepts a reader must hold; prefer the restructuring that makes branches disappear). Feature logic shouldn't leak into shared modules; reuse the canonical helper over a near-duplicate.
4. **Security** — see `references/security-checklist.md`.
5. **Performance** — see `references/performance-checklist.md`.

## Structural Remedies

When you flag a structural problem, propose the move, not just the problem: replace a chain of conditionals with a typed model/dispatcher; collapse duplicate branches; separate orchestration from business logic; move feature logic out of shared modules; make a type boundary explicit; delete a pass-through wrapper; extract a helper or split a large file. Prefer the remedy that removes moving pieces.

## Presumptive Blockers

For each of these structural problems, surface it and propose the simpler design by default; escalate to Required only when the change actively makes structure worse:

- A refactor that relocates complexity instead of reducing it
- A change that pushes a file past the size boundary with no decomposition
- Feature logic added to a shared module
- A near-duplicate of an existing canonical helper
- A silent fallback that hides an unclear invariant

## Dead Code Hygiene

After any refactoring or implementation change, check for orphaned code:

1. Identify code that is now unreachable or unused.
2. List it explicitly (name, file, why it's dead — e.g. "replaced by X", "no remaining references").
3. **Ask before deleting**: "Should I remove these now-unused elements: [list]?" Don't leave dead code lying around, but don't silently delete things you're not sure about. When in doubt, ask.

## Comment Rot

When the diff adds or modifies comments or docstrings, cross-check every claim against the code: signatures, described behavior, referenced symbols, edge cases, and performance claims must all hold today. Flag for removal comments that restate obvious code, reference temporary or transitional states, or describe behavior that has drifted. Why-comments outlive what-comments; even an accurate what-comment is a liability when it duplicates the code it sits on. Check TODOs and FIXMEs against the current tree — the work may already be done.

## Change Sizing

- ~100 lines changed → good; ~300 → acceptable if one logical change; ~1000 → split.
- Also watch **file size** (~1000 total lines in one file is a signal to decompose), not just diff size.
- **Separate refactoring from feature work** — two changes, two PRs.
- Splitting strategies: stack, by file group, horizontal (shared code first), vertical (full-stack slices).

## Approval Standard

Approve when the change definitely improves overall code health, even if it isn't perfect — perfect code doesn't exist, and "not how I would have written it" is not a blocker. The strictness in this file applies to correctness and structure, not to style preference.

- Change descriptions: first line imperative and standalone. "Fix bug", "Phase 1", and "Add convenience functions" describe nothing.
- Large diffs are acceptable when they are complete file deletions or automated refactors — verify intent, not line count.

## Severity Labels

Label every finding so the author knows required vs optional: `Critical:` (blocks merge — security/data loss/broken), no-prefix (required), `Nit:` (optional), `Optional:/Consider:` (suggestion), `FYI` (informational). Lead with leverage — a few high-conviction comments beat a long list; one structural problem is the review.

## Dependency Discipline

Before adding a dependency: does the existing stack solve it? how large? actively maintained? known vulnerabilities? license? Prefer stdlib and existing utils. For upgrades: read the changelog, not just the version; one dependency per change; let a green suite decide; review the lockfile diff (not just `package.json`); never hand-edit the lockfile.

## Honesty

Don't rubber-stamp; don't soften real issues; quantify problems when possible; push back on clearly wrong approaches; comment on code, not people.

## Disagreement Hierarchy

Technical facts/data > style guides > engineering principles > codebase consistency. Don't accept "I'll clean it up later" — require cleanup before submission or file a bug.

_Comment-rot checklist adapted from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) pr-review-toolkit (Apache 2.0)._
