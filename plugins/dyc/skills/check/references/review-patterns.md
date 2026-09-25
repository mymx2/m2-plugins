# Conditional Review Patterns

Load only the sections whose trigger appears in the diff. These are hard stops when the described failure can reach users; otherwise report them as advisory.

## Recurring or hard-to-observe bugs

For a recurring visual, layout, timing, or stateful-UI bug, do not accept another tuned constant as durable coverage. Pull the decision into a pure function and test the violated invariant, such as nonzero width, half-open hit regions, or bounded offsets. Runtime inspection proves one instance; the invariant prevents recurrence.

Do not demand a fake seam. If a shallow helper cannot exercise the real failure at its call site, report `no correct test seam` as the architectural defect. A pure function covers one wrong decision. It does not cover future callers bypassing a guard. For a silent, costly primitive such as direct deletion, raw privilege escalation, or an unbounded external command, add a source-invariant test that enumerates call sites and rejects raw usage outside an explicit allowlist.

## Captured output and asynchronous completion

When code branches on an error message or captured command output, probe what the string contains at runtime. A subprocess using inherited stdio may show diagnostics in the terminal while `error.message` contains only the command line. Prefer structured facts such as exit codes or known targets over reparsing prose.

Flag fixed `sleep`, `asyncAfter`, `setTimeout`, frame counts, or guessed timeouts that stand in for an observable completion signal. They vary across CPU speed, display refresh rate, and networks. Drive the next step from callbacks, navigation completion, frame changes, state flags, or wall-clock state as appropriate.

## Simplification and deletion

For prose, rule, skill, or guidance consolidation, read the deletions back and classify every removed behavior as `folded into X`, `redundant with Y`, or `behavior removed`. List behavior-removed entries explicitly. Deletion volume is not evidence of a good pass.

For dead-code or YAGNI claims, search the whole repository: entrypoints, docs, tests, generated dispatch tables, scripts, CI, packaging allowlists, manifests, and dynamic lookup patterns. Separate test-only from production references and chase data written but only read indirectly. If a dev tool is merely exposed by the wrong package or mirror, tighten distribution rather than deleting the tool. Partial search scope cannot justify deletion.

## History-sensitive normalization

When a diff restores a recently removed symbol, string, asset, enum case, localization entry, or config field, confirm current main still consumes it. A parity test or stale rule is not proof of life.

Before making an outlier match its siblings, inspect the change or comment that introduced the divergence. The asymmetry may deliberately avoid a known defect; normalization must preserve that protection.

## Non-atomic replacement of user files

When a diff writes to a path the user already has (`curl -o`, `>`, `tee`, open-truncate-write), ask what survives a failure partway through. Truncating the destination first means a dropped connection, timeout, or non-zero exit leaves a corrupt file and no original. Require staging into a sibling temp file, swapped in only once the content is complete.

Staging covers the paths the code tests for. It does not cover signals: with no trap, an interrupt mid-write can both strand the temp file and let the shell run past the interrupt to install partial content. A fetch running with `-fsSL`, `2>/dev/null`, or a swallowed exit code compounds this by telling the user nothing about what broke or what was left intact.

## Destructive matcher breadth

For recursion, mass deletion, traversal, ID-prefix wildcards, or fallback regex branches feeding a destructive sink, inspect:

- matcher breadth in every primary and fallback branch;
- protected-path coverage at the new entry point;
- user-confirmation paths; and
- whether the guard lives inside the deletion primitive rather than only at one caller.

Ask for the narrowest evidence authorizing deletion. Exact identifiers and exact paths can pass. Display names, vendor prefixes, common tokens, and user labels cannot safely authorize neighboring deletion.

## Duplicated derivations

Flag a classification, ordering, threshold, count, or eligibility rule computed independently in two places. Summary/list, preview/executor, score/explanation, and ordering/control pairs drift after the first one-sided change. Require one constant or pure function and have both consumers use it. When one side changes, search for its sibling.

## Test surface fidelity

A test is not coverage when it pins a helper that production never reaches or asserts the literal source form of a command/config string instead of the shipped entry point. Ask whether it fails on the unfixed code and whether users execute the asserted path. If either answer is no, the test is a finding.

## Never-shipped migrations

Reject migration scaffolding, version-gated defaults, or old-key carry-forward logic when the underlying preference, schema, or feature first appears in the current unreleased work. Compare with the last published tag. If the key did not ship, use the default path; migration is dead-on-arrival complexity.

## Unknown identifiers

Search every new function, type, variable, asset, command target, and config key that the diff assumes already exists. No result outside the new diff means the dependency is unproven. Dynamic registries require checking their generation or lookup path rather than trusting a name match.

## Silent failures and error handling

When the diff adds or changes try/catch, error callbacks, fallback logic, or error-state branches, audit each handler:

- Catch specificity: could this catch suppress unrelated errors? Name the unexpected error types it would hide; split by error type when the answer is non-trivial.
- Hidden-failure shapes: empty catch; log-and-continue; returning null/default on error without logging; optional chaining or null coalescing that silently skips a failable operation; retry logic that exhausts attempts without surfacing; fallback chains that try another approach without saying why.
- Fallbacks must be explicit and justified: a fallback the user did not request and the spec does not document masks the underlying problem. Falling back to a mock, stub, or fake outside test code is an architectural defect, not error handling.
- Propagation: should this error bubble to a higher handler instead of being caught here, and does catching it prevent cleanup or resource release?
- Message quality: a user-facing error says what went wrong and what to do next, specific enough to distinguish it from similar errors.

An error that can occur in production with neither a log nor user feedback is a hard stop.

## New type definitions

When the diff introduces a type, class, or domain model, audit its invariants:

- Name every implicit invariant: field relationships, valid state transitions, preconditions. An invariant maintained only by convention or documentation is a finding.
- Illegal states should be unrepresentable: prefer construction-time validation and guarded mutation points over checks scattered across call sites.
- Flag exposed mutable internals, anemic models whose invariants depend on external callers, and enforcement that differs across mutation methods.
- Weigh the enforcement cost: prefer compile-time guarantees where cheap, and do not demand validation machinery that exceeds the type's role in the system.

_Silent-failure and type-invariant patterns adapted from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) pr-review-toolkit (Apache 2.0)._

## Get the Diff

Derive the review baseline from the user's words and current repository state. Do not ask for commits when the scope is already inferable:

- **All local or uncommitted changes**: inventory staged, unstaged, and untracked files, plus local commits ahead of the configured upstream. Even when the current branch is the base branch, the scope is still inferable from staged/unstaged/untracked state.
- **PR or branch review**: use the merge base through the reviewed head, then add any dirty files in that checkout as a separate surface.
- **Since the last release**: use the latest published stable tag through `HEAD`, not the local version field, then add dirty files.
- **Recent N days or an explicit ref**: resolve that time/ref boundary through `HEAD`, then add dirty files.
- **Known-good or previous working version**: compare that ref through `HEAD`; route to `/hunt` Bisect Mode only when the regression point itself is unknown.
- **Whole-project audit**: use Audit Mode rather than pretending one diff is the repository.

Freeze the resolved base, `HEAD`, worktree inventory, generated/distribution surfaces, and delegated scopes before review. Ask one narrow question only when two plausible baselines would materially change the verdict. If review fixes are applied or repository state moves, the old verdict expires: re-read `HEAD`, status, and the full resolved diff before signing off.

## Scope Classification

Measure the diff and classify depth. These thresholds are default intuition, not law — a project may override them in `references/project-context.md`; explicit depth language in the request always overrides size.

| Depth        | Criteria (default intuition)                              | Coverage                                        |
| ------------ | --------------------------------------------------------- | ----------------------------------------------- |
| **Quick**    | Small diff (order of <100 lines, a handful of files)      | Base review only                                |
| **Standard** | Medium (order of 100-500 lines, or several files)         | Base + conditional domain checklists            |
| **Deep**     | Large, or touches auth/payments/data mutation at any size | Base + all domain checklists + adversarial pass |

State the depth before proceeding. Explicit depth language overrides the size thresholds. "All", "全部", "deep", "深入", or "仔细" means whole-scope coverage of the resolved inventory, even when the textual diff is small; it does not permit skipping untracked files, generated mirrors (files auto-produced by a build step that mirror source, e.g. `dist/`, `build/`, `generated/`), required artifacts, or pending reviewers.

Static content diffs can stay quick even when they touch several generated files: version strings, dates, release-copy mirrors, sitemap dates, or one-for-one localization copy changes usually need line-by-line readback plus grep consistency, not the full checklist fleet. Escalate only when the diff changes logic, generation rules, public distribution behavior, or user-facing semantics beyond the literal text replacement.

## Scope Drift Detection

Before reading code, check scope drift: do the diff and the stated goal match? Label: **on target** / **drift** / **incomplete**.

When the completeness check is delegated, forward the original requirement verbatim (issue/PR description, commit message, task brief) — paraphrased handoffs lose constraints, and the drift verdict must be grounded in the source text, not a retelling.

**Promise-by-promise verification (when an upstream spec exists).** Run the Spec Axis promise-by-promise three-state table per `references/review-quality.md` (Spec Axis) before the generic findings list.

Also check surgical traceability: every changed file and every new public surface must trace back to the user's stated goal. If a file, dependency, config knob, abstraction, generated artifact, workflow permission, or release behavior cannot be explained in one sentence from the request, label it drift until proven necessary.

For every new public setting, flag, environment variable, command, or service, ask who will change it and why one correct default cannot serve them. If there is no evidenced user split, treat the knob as scope drift and fix the default path instead.

Drift signals (examples, not exhaustive -- any one is enough to label drift):

- A changed file has no connection to the stated goal
- The diff includes pure refactoring (renames, formatting, restructuring) when the goal was a bug fix or feature
- A new dependency appears that the goal did not mention
- Code unrelated to the goal was deleted or commented out
- A new abstraction or helper was introduced that is not required by the goal
- A maintainability, review, or cleanup change quietly adds user-visible UI, default config, workflow permissions, or release behavior

## Question the Approach, Not Just the Diff

Scope drift checks the diff against the stated goal; this checks the goal against the approach. Skip when the user declares the route settled or the repo's design docs record the decision -- do not re-litigate deliberate trade-offs.

When findings cluster on one root cause -- the same bug class patched repeatedly, permission or state problems that follow from the architecture itself, a simple problem made complex -- stop listing patches and state the route verdict first: keep / adjust / replace / insufficient information. Compare a real alternative only when it eliminates the problem class at an acceptable migration cost; never manufacture one to fill the report. No patch list before the verdict.

## Behavior Contract Impact

Beyond whether the diff does what was asked, check what else it touches. Sweep these contract surfaces for new side effects or regressions the diff introduces: public API and default behavior, schema and config shape, global or shared state, I/O and persistence, concurrency and ordering, registered hooks/callbacks/listeners, implicit dependencies (load order, singletons, caches), and downstream-visible drift (output format, logs, metrics, events). Pre-existing issues outside the diff's scope are not findings; report only regressions the diff itself introduces.

## Pattern-Fix Completeness

When the diff fixes one instance of a class-of-bug (a missing validation, a wrong selector, an off-by-one, a missing lock), the same shape often lives elsewhere. Extract the pattern signature, `grep -rn` it across the repo (exclude generated dirs), and confirm sibling instances were also handled. List any unswept sibling: flag it as a hard stop when it carries the same risk, advisory when lower-risk.

When the diff contains a recurring or hard-to-observe bug, output-string branching, guessed waits, consolidation or dead-code deletion, history-sensitive restoration, broad destructive matchers, duplicated derivations, test-only seams, never-shipped migrations, unknown identifiers, error-handling changes, or new type definitions, load the matching section of `references/review-patterns.md`. Do not load that catalog for unrelated diffs.
