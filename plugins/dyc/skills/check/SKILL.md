---
name: check
description: 'Reviews code diffs, PRs, issue queues, release readiness, commits, pushes, publishing, project audits, domain conformance (test coverage, security, performance, observability), and document or prose audits against the writing rulebook. Use when users ask for code review, issue or PR triage, release gates, publishing follow-through, project audits, security/performance/readiness review, or doc proofreading. Not for debugging root causes or writing new prose.'
when_to_use: 'review, 看看代码, 检查一下, 有没有问题, 是否需要优化, 合并前, 继续优化, 优化代码, 看看issue, 看看PR, release, publish, push, release reaction, GitHub reaction, 发布, 提交, 关闭issue, 发布表情, release表情, close issue, issue close, review my code, check changes, before merge, before release, 值得发布, ready to release, code review, audit, project audit, 项目体检, 项目评分, 给项目打分, 深入分析项目代码, 评估项目质量, 代码质量评分, scorecard, linus review, rate this codebase, score this project, 安全审查, 安全加固, security review, 性能检查, performance review, 测试覆盖, test coverage, 可观测性, observability, review docs, 审稿, 文档检查, writing review, proofread files'
---

# Check: Review Before You Ship

Prefix your first line with 🥷 inline, not as its own paragraph.

> Note: this skill is named `check`. Some runtimes alias it as `code-review`. Do not invoke any other review command from inside this skill.

Read the diff and find the problems. Review, audit, triage, and readiness requests are report-only; apply fixes only when the current turn explicitly asks to fix, change, implement, or optimize. Done means the requested review surface is covered and every verification claim comes from this session.

## Overview

check is the last gate between code and users. It reads diffs, PRs, issues, releases, and documents, then produces findings grounded in evidence from the current session — never from memory or inference alone. It covers code review (quick/standard/deep), issue/PR triage, ship/release follow-through, project audits, and document proofreading, with domain checklists and adversarial passes activated by scope depth.

## Outcome Contract

- Outcome: a review, release decision, or maintainer action grounded in the current diff, project context, and live evidence.
- Done when: findings, fixes, shipped state, or blockers are stated with the commands, artifacts, or remote state that prove them.
- Evidence: worktree status, diff, public project docs, manifests, CI, package contents, release or registry state, and current command output.
- Output: concise findings first, then verification and shipped-state summary when applicable. Multi-step or ship-action runs, and any request with several items or screenshots, close with a numbered completion ledger (done / not applicable / remaining), never a narrative that leaves the user asking "is everything done".
- Authorization: read-only intent may inspect the worktree and remote state but may not edit files, apply autofixes, commit, push, publish, comment, close, merge, or change branches. Each write or public action needs current-turn authorization, except when the user explicitly authorizes a named batch that contains it.

## When to Use

- User asks for code review, PR review, or "看看代码" / "检查一下" / "合并前"
- Issue triage, batch processing, or "看看issue" / "批量处理"
- Release readiness: "值不值得发版" / "ready to release" / ship/publish actions
- Project audit or scorecard: "项目体检" / "项目评分" / "linus review"
- Document or prose review against the writing rulebook
- Route to `/think` when the user needs planning before review
- Route to `/hunt` when the regression point itself is unknown
- Route to `/health` when the user wants ongoing monitoring rather than a point-in-time review

## Worktree Safety Preflight

Before any review, triage, ship, release, or PR operation, read the current worktree with:

```bash
git status --short --branch -uall
```

Treat modified, staged, and untracked files as user work. You may read them and include them in the review surface, but you must not move, hide, overwrite, clean, or discard them without explicit user approval in the current turn.

Do not run these commands as default review or PR setup: `git switch`, `git checkout`, `git reset --hard`, `git clean`, `git stash -u`, `git stash --include-untracked`, `git stash -a`, `git stash --all`, or `gh pr checkout`. If a branch change or cleanup is genuinely required, stop and ask for that exact operation. Moving untracked files or WIP into `/tmp` or another holding directory is the same class of interference as stashing it; when a clean tree is required, use a separate worktree from a known commit and copy back only the artifact you own.

For commit or push follow-through in a dirty or multi-agent checkout, record `git rev-parse HEAD` before staging. Re-read `git status --short --branch -uall` and `git rev-parse HEAD` immediately before commit and again before push. If HEAD moved, unknown commits appeared, or the worktree changed outside your intended files, stop and report the mismatch instead of rebasing, recommitting, or pushing.

For PR inspection, prefer commands that do not switch the current working tree: `gh pr view`, `gh pr diff`, `git fetch origin pull/<n>/head:refs/tmp/pr-<n>`, and `git merge-tree`.

## Mode Picker

Pick the mode that matches the user's intent, then read it in full before acting. Modes layer on top of the shared review surface (Scope, Hard Stops, Autofix, Specialist Review, Verification, Sign-off) further down, which applies in every mode. Load a mode file only when its row matches; the default review path needs none of them.

| User intent                                                                                    | Mode                                                           |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| "implement this plan", `/think` output handed off                                              | load `references/mode-ship.md` (Plan Execution Mode)           |
| Diff or PR ready, "review", "看看代码", "合并前"                                               | Default review (start at [Get the Diff](#get-the-diff))        |
| "能删什么", "过度工程", "over-engineering review", "what can we delete"                        | load `references/deletion-review.md`                           |
| "look at issues", "review PRs", "triage", "批量处理"                                           | load `references/mode-triage.md`                               |
| "is this worth a release", "值不值得发版"                                                      | load `references/mode-ship.md` (Release Worthiness Analysis)   |
| "commit", "push", "publish", "release", "close issue", "发布表情"                              | load `references/mode-ship.md` (Ship / Release Follow-through) |
| "audit", "项目体检", "项目评分", "给项目打分", "深入分析项目代码", "scorecard", "linus review" | load `references/mode-audit.md`                                |
| Document, PDF, prose review                                                                    | load `references/writing-review.md`                            |

Before any mode, run [Project Context Extraction](#project-context-extraction) and (if memory is in scope) [Durable Context Preflight](#durable-context-preflight).

## Project Context Extraction

Before reviewing, extract project constraints from repository context:

1. Read the diff and identify changed languages, frameworks, manifests, generated outputs, release files, and CI workflows.
2. Inspect public project files only as needed: README, AGENTS/CLAUDE instructions when present, package manifests, lockfiles, build configs, test configs, workflow files, and release notes.
3. Compress the findings into review context: verification commands, protected or generated files, release artifacts, domain risks, and public reply rules.
4. Apply the stricter rule when project context and this skill overlap.
5. If project docs or CI name a verification command, prefer that over auto-detection.

For the context shape, see `references/project-context.md`.

For release or maintainer work, also fill the Release Gate 2.0 matrix from `references/project-context.md`. It covers review base, dirty/staged/untracked state, latest tag, origin sync, version fields, generated artifacts, package/archive contents, release assets, registry/appcast/CI, and public issue/PR state. Missing matrix evidence is a blocker for a "ready to release" claim.

## Durable Context Preflight

When the user names memory, a prior decision, or a memory path, apply the durable-context rules: current state wins over memory, memory is never authorization for state changes, and the redaction gate applies before any of it becomes a durable rule.

For `/check`: the current diff, CI, and remote state override memory. Durable memory can explain user intent and preferred follow-through, but public project rules still come from README files, manifests, CI workflows, release docs, and explicit instructions in the current thread. Never cite private memory as a public project requirement.

## Plan Execution Mode

Load `references/mode-ship.md` (Plan Execution Mode). It also covers the review-then-ship default continuation.

## Get the Diff

Derive the review baseline from the user's words and current repository state. Do not ask for commits when the scope is already inferable:

- **All local or uncommitted changes**: inventory staged, unstaged, and untracked files, plus local commits ahead of the configured upstream. Even when the current branch is the base branch, the scope is still inferable from staged/unstaged/untracked state.
- **PR or branch review**: use the merge base through the reviewed head, then add any dirty files in that checkout as a separate surface.
- **Since the last release**: use the latest published stable tag through `HEAD`, not the local version field, then add dirty files.
- **Recent N days or an explicit ref**: resolve that time/ref boundary through `HEAD`, then add dirty files.
- **Known-good or previous working version**: compare that ref through `HEAD`; route to `/hunt` Bisect Mode only when the regression point itself is unknown.
- **Whole-project audit**: use Audit Mode rather than pretending one diff is the repository.

Freeze the resolved base, `HEAD`, worktree inventory, generated/distribution surfaces, and delegated scopes before review. Ask one narrow question only when two plausible baselines would materially change the verdict. If review fixes are applied or repository state moves, the old verdict expires: re-read `HEAD`, status, and the full resolved diff before signing off.

## Scope

Measure the diff and classify depth. These thresholds are default intuition, not law — a project may override them in `references/project-context.md`; explicit depth language in the request always overrides size.

| Depth        | Criteria (default intuition)                              | Coverage                                        |
| ------------ | --------------------------------------------------------- | ----------------------------------------------- |
| **Quick**    | Small diff (order of <100 lines, a handful of files)      | Base review only                                |
| **Standard** | Medium (order of 100-500 lines, or several files)         | Base + conditional domain checklists            |
| **Deep**     | Large, or touches auth/payments/data mutation at any size | Base + all domain checklists + adversarial pass |

State the depth before proceeding.

Explicit depth language overrides the size thresholds. "All", "全部", "deep", "深入", or "仔细" means whole-scope coverage of the resolved inventory, even when the textual diff is small; it does not permit skipping untracked files, generated mirrors (files auto-produced by a build step that mirror source, e.g. `dist/`, `build/`, `generated/`), required artifacts, or pending reviewers.

Static content diffs can stay quick even when they touch several generated files: version strings, dates, release-copy mirrors, sitemap dates, or one-for-one localization copy changes usually need line-by-line readback plus grep consistency, not the full checklist fleet. Escalate only when the diff changes logic, generation rules, public distribution behavior, or user-facing semantics beyond the literal text replacement.

## Did We Build What Was Asked?

Before reading code, check scope drift: do the diff and the stated goal match? Label: **on target** / **drift** / **incomplete**.

When the completeness check is delegated, forward the original requirement verbatim (issue/PR description, commit message, task brief) — paraphrased handoffs lose constraints, and the drift verdict must be grounded in the source text, not a retelling.

Also check surgical traceability: every changed file and every new public surface must trace back to the user's stated goal. If a file, dependency, config knob, abstraction, generated artifact, workflow permission, or release behavior cannot be explained in one sentence from the request, label it drift until proven necessary.

For every new public setting, flag, environment variable, command, or service, ask who will change it and why one correct default cannot serve them. If there is no evidenced user split, treat the knob as scope drift and fix the default path instead.

Drift signals (examples, not exhaustive -- any one is enough to label drift):

- A changed file has no connection to the stated goal
- The diff includes pure refactoring (renames, formatting, restructuring) when the goal was a bug fix or feature
- A new dependency appears that the goal did not mention
- Code unrelated to the goal was deleted or commented out
- A new abstraction or helper was introduced that is not required by the goal
- A maintainability, review, or cleanup change quietly adds user-visible UI, default config, workflow permissions, or release behavior

## Behavior Contract Impact

Beyond whether the diff does what was asked, check what else it touches. Sweep these contract surfaces for new side effects or regressions the diff introduces: public API and default behavior, schema and config shape, global or shared state, I/O and persistence, concurrency and ordering, registered hooks/callbacks/listeners, implicit dependencies (load order, singletons, caches), and downstream-visible drift (output format, logs, metrics, events). Pre-existing issues outside the diff's scope are not findings; report only regressions the diff itself introduces.

## Pattern-Fix Completeness

When the diff fixes one instance of a class-of-bug (a missing validation, a wrong selector, an off-by-one, a missing lock), the same shape often lives elsewhere. Extract the pattern signature, `grep -rn` it across the repo (exclude generated dirs), and confirm sibling instances were also handled. List any unswept sibling: flag it as a hard stop when it carries the same risk, advisory when lower-risk.

When the diff contains a recurring or hard-to-observe bug, output-string branching, guessed waits, consolidation or dead-code deletion, history-sensitive restoration, broad destructive matchers, duplicated derivations, test-only seams, never-shipped migrations, unknown identifiers, error-handling changes, or new type definitions, load the matching section of `references/review-patterns.md`. Do not load that catalog for unrelated diffs.

## Red Flags

- Writing "I verified" or "tests pass" without the shell output in the current transcript
- Signing off while any delegated review pass or verification command is still pending
- Manufacturing findings to justify the invocation — a clean review with zero findings is a valid output
- Publishing or shipping over your own open findings without explicit "known, shipping anyway" confirmation
- Stating "all read" or "full audit complete" while delegated scopes remain unreviewed
- Treating a local build/test pass in a dirty multi-agent checkout as proof — verify in isolated worktree

## Hard Stops (fix before merging)

Examples, not exhaustive -- flag any diff that could cause irreversible harm if merged unreviewed.

- **No unverified claims.** Do not write "I verified X", "I ran Y", "tests pass", or "this fixes Z" unless the shell output is in this turn's transcript. If you reason about behavior without running, say "based on reading the code" instead of "I verified". Every verification claim in the sign-off must point to a command that actually ran in this session.
- **Re-read source-of-truth facts.** Refresh line numbers, worktree state, fallback behavior, locale coverage, and artifact state in the current turn before citing them. Earlier context and reviewer notes are leads, not evidence.
- **Destructive auto-execution**: any task marked "safe" or "auto-run" that modifies user-visible state (history files, config, preferences, installed software) must require explicit confirmation.
- **Source and distribution out of sync**: everything the source change implies downstream must be regenerated, tracked, uploaded, and version-consistent before declaring done: generated or bundled outputs rebuilt and included, every artifact named in release notes or workflows actually uploaded, every new helper module, reference file, or script present in the built archive, and version fields synchronized across manifests, package metadata, changelogs, tags, and lockfiles.
- **Verifier failure layer unclear**: if a verifier fails before assertions or due to missing optional dependencies, bootstrap noise, transient build-service crashes, unavailable simulators, or tool setup, classify setup versus product failure. Retry only with new evidence or a narrower environment. Do not call the repo broken until the intended test body or artifact check actually ran. The inverse is the same stop: a verifier that passes without running the real path -- a skipped optional-dependency job that still prints OK, a function that early-returns leaving output empty so a true-on-empty assertion passes, a render reported fixed but never opened -- is a hollow green (a pass that never actually exercised the real path). A pass counts only when at least one non-skipped, non-empty case exercised the path and the assertions fail on emptiness.
- **Publishing over your own open findings**: when the same run produced review findings and then reaches a ship action, every finding must be fixed, or restated as "known, shipping anyway" with its user impact and confirmed, before the release proceeds. A standing release authorization does not cover problems discovered after it was given.
- **Security findings gate the handoff**: when a review surfaces security findings and the same task continues toward commit, push, PR/MR, merge, release, or deploy, present every finding first (severity, CWE, file:line, vulnerable snippet, remediation, data-flow summary), then get an explicit fix-or-continue decision on the findings shown; an earlier handoff request or scan approval never implies fix approval. After approved fixes, report changed files and verification, then halt for a new user message — fixing is not authorization to commit or push. Never chain `git add && git commit && git push` into one command; commit, then stop at the gate before any handoff command. Full protocol: `references/security-checklist.md` (Security Handoff Gate).
- **Injection and validation**: SQL, command, path injection at system entry points. Credentials hardcoded, logged, committed, or copied into public docs.
- **Dependency changes**: unexpected additions or version bumps in package.json, Cargo.toml, go.mod, requirements.txt. Flag any new dependency not obviously required by the diff. The inverse is a finding too: a declared dependency or linked SDK with zero imports across the repo gets flagged to the maintainer, not silently removed (it may be staged for an upcoming feature, and unused analytics/telemetry SDKs still drag app review and privacy manifests). Removal needs the maintainer's go-ahead in the current turn, a grep proving zero references first, and a full build after.
  - **Verify a lockfile by regenerating it, not by reading it.** For any PR that edits a lockfile, run the package manager's own update command for that one package in a clean worktree off the PR's base (`pnpm update <pkg> --lockfile-only`, `npm install <pkg>@<v> --package-lock-only`) and diff your result against theirs. Byte-identical means a real tool produced it; divergence means it was hand-edited and the manifest and lockfile may now disagree in ways `--frozen-lockfile` will reject at release time. For automated security PRs, also diff the full manifest (whole-file reserialization -- the package manager rewriting the file with its own formatter -- can escape non-ASCII or reorder keys) and confirm the package is actually built into the shipped artifact before repeating the advisory's severity.
- **Safety sinks**: destructive file operations, shell or AppleScript construction, cwd/path/symlink traversal, approval or sandbox boundary changes, signing/appcast flows, and auth prompts need explicit review of validation, rollback, and user-confirmation behavior.

## Finding Quality Gate

Before writing any finding into the report, run this gate:

**Pre-report self-check (four questions, every finding must pass):**

1. Can I cite the exact file:line?
2. Can I describe the specific input or state that triggers the bad outcome?
3. Have I read the upstream callers / downstream consumers, not just the function in isolation?
4. Is the severity defensible? Would a senior reviewer raise this at this level in a real PR?

If any answer is "no", drop the finding or downgrade it to advisory. Vague findings train the reader to ignore real ones.

Finding titles stand alone and lead with the consequence: a reader skimming only the titles understands each harm without reading the detail. Counts, absences, and similarities to known-bad patterns are leads to verify, not findings — promote one only with a live trigger path.

**A clean review is a valid review.** Do not manufacture findings to justify the invocation. Zero findings with a stated review surface is a complete output. Padding the report with low-confidence noise is a worse outcome than reporting nothing.

**HIGH and CRITICAL require three pieces of evidence:**

1. The exact file:line where the bug lives.
2. The specific trigger: what input, state, or sequence produces the bad outcome.
3. Why existing guards (validation, type system, upstream catch, framework default) do not already prevent it.

Cannot supply all three? Downgrade to MEDIUM, or drop. "This _might_ break under some condition" is not a HIGH.

## Conformance Review

Beyond correctness, run the domain checklists when the diff touches the relevant surface. Load the matching reference and work it as part of the sign-off:

| Diff touches                                                                              | Load checklist                          |
| ----------------------------------------------------------------------------------------- | --------------------------------------- |
| User input, auth, data storage, external integrations, uploads, payments, PII, LLM output | `references/security-checklist.md`      |
| Logic, bug fixes, behavior changes, or new features                                       | `references/test-checklist.md`          |
| Load time, interaction, data fetching, queries, bundle                                    | `references/performance-checklist.md`   |
| Production features, I/O, retries, queues, cross-service calls                            | `references/observability-checklist.md` |

Name which checklists you ran in the sign-off and mark each green/blocked. If none apply, state `conformance: n/a`. Do not manufacture findings from these checklists — a clean pass is a valid result.

## Review References

Load the matching reference when the review enters that territory:

| When reviewing                                                                                              | Load                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Findings need sharpening, severity labels, change sizing, dependency discipline, stale or drifting comments | `references/review-quality.md`                                                                                                                                                 |
| Code works but is over-complicated or hard to read                                                          | `references/simplification.md`                                                                                                                                                 |
| A non-trivial decision needs adversarial, fresh-context checking                                            | `references/doubt-review.md`                                                                                                                                                   |
| Commits, branching, or release/versioning decisions                                                         | `references/git-workflow.md`                                                                                                                                                   |
| Drafting a maintainer reply on a public issue or PR (triage or ship follow-through)                         | `references/public-reply.md`                                                                                                                                                   |
| CLI entrypoint, installer, completion, config/env, or mutating command (cleanup/update/uninstall/migration) | `references/release-surfaces.md` (CLI Command Surface); terminal output is a rendered surface: after changing CLI-facing text, re-run the command and read the real output     |
| Skill, plugin, marketplace entry, package allowlist/manifest, generated mirror, or published archive        | `references/release-surfaces.md` (Packaged Install Surface): verify the installed runtime contract; manifest JSON or source tests never substitute for installed-runtime proof |
| Build/deploy pipeline changes or automated checks                                                           | `references/ci-cd.md`                                                                                                                                                          |
| Release-worthiness or launch readiness beyond the basic gate                                                | `references/shipping.md`                                                                                                                                                       |
| A multi-file or multi-slice change (scope/feature-flag/rollback discipline)                                 | `references/incremental-guardrails.md`                                                                                                                                         |
| Removing an API/feature, migrating consumers, or a schema change                                            | `references/migration.md`                                                                                                                                                      |
| The standing project-wide bar every change clears before done                                               | `references/definition-of-done.md`                                                                                                                                             |
| Concrete JS/TS testing syntax (Jest, RTL, Supertest, Playwright)                                            | `references/testing-patterns.md`                                                                                                                                               |

## Knowledge Sync

When a finding recurs, or the diff introduces an invariant not yet in project docs, load `references/knowledge-sync.md` and promote it to a durable rule. Sign-off reports `doc debt: none` when no new invariant exists.

## Specialist Review (Standard and Deep only)

Specialist reviewers are agent definitions, not skill content: whether they exist and how they are dispatched depends on the harness's agent facility and the vendor's registration, so this skill ships none. When the environment provides registered specialists, dispatch the activated ones with the full diff; otherwise run the domain passes yourself through [Conformance Review](#conformance-review). Either way, the rules below govern the findings.

Merge findings: when two passes flag the same code location, keep the higher severity and note cross-pass agreement. Findings on different code locations are never duplicates even if they share a theme.

Every pass finding is a claim to verify, not a fact to act on. For HIGH and CRITICAL claims, run a skeptic pass in the same session: re-read the cited code this turn and confirm the claim is real and live, not already handled elsewhere, not consistent-by-design, not a latent-only risk labeled as a live bug. Reviewers over-report from name-based inference and partial context; drop what dissolves on direct read, and cite the verification path before routing anything to Autofix or sign-off.

Before a whole-scope verdict, reconcile a completion ledger for every delegated review: assigned scope, returned status, and uncovered remainder. Wait for every active pass, or name its scope as unreviewed. Never say "all read", "full audit complete", or "no issues" while any pass or required verification is still pending.

## Autofix Routing

| Class        | Definition                                                                 | Action                                                             |
| ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `safe_auto`  | Unambiguous, risk-free: typos, missing imports, style inconsistencies      | Apply only after explicit write authorization; otherwise report it |
| `gated_auto` | Likely correct but changes behavior: null checks, error handling additions | Batch into one user confirmation block                             |
| `manual`     | Requires judgment: architecture, behavior changes, security tradeoffs      | Present in sign-off                                                |
| `advisory`   | Informational only                                                         | Note in sign-off                                                   |

After explicit write authorization, apply `safe_auto` fixes before surfacing the `gated_auto` confirmation block. In report-only mode, do not modify the worktree.

Any fix made during review invalidates the pre-fix verdict. Re-freeze the baseline, re-run the check that exposed the finding, refresh the sibling sweep, and complete the final adversarial pass required by the review depth before declaring ready.

## Adversarial Pass (Deep only)

"If I were trying to break this system through this specific diff, what would I exploit?" Four angles: assumption violation, composition failures, cascade construction, abuse cases. Run each angle blind to the others' findings: convergence from independent angles raises confidence, and singleton findings face the same per-finding skeptic verification as other claims. Suppress findings below 0.60 confidence.

## Verification

When project docs or CI name a verification command (see [Project Context Extraction](#project-context-extraction)), run that command. Otherwise run `bash <skill-base-dir>/scripts/run-tests.sh` from the target project root (`<skill-base-dir>` is this skill's base directory; the script auto-detects the project's test command from the current working directory). Auto-detection is a fallback heuristic — when it conflicts with the project's own toolchain, the project command wins. Paste the full output.

If the script exits non-zero or prints `(no test command detected)`: halt. Do not claim done. Ask the user for the verification command before proceeding. If the user also cannot provide one, document this explicitly in the sign-off as `verification: none -- no command available` and flag it as a structural gap, not a pass.

For bug fixes: a regression test that fails on the old code must exist before the fix is done.

In a dirty or multi-agent checkout, a passing local build or test run is not proof your change is sound: unrelated WIP already in the tree can supply missing symbols, mask a break, or fail for reasons unrelated to you. Verify in isolation -- `git worktree add --detach <known-good-commit>`, `git apply` only the diff of the files you own, then build/test there. The clean isolated pass is the real signal; the contaminated local pass is not.

## Gotchas

| What happened                                                     | Rule                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Posted a public reply to the wrong issue or PR thread             | Re-read the target with `gh issue view N` or `gh pr view N` and confirm title, author, and current state before acting |
| PR comment sounded like a report                                  | 1-2 sentences, natural, like a colleague. Not structured, not AI-sounding.                                             |
| PR comment used bullet points                                     | Write as short paragraphs, one thought per paragraph; thank the contributor first                                      |
| New file name duplicated a locale, platform, or suffix convention | Check the target directory's existing naming convention before creating or renaming files                              |
| Deployed without provider runtime or env checks                   | Follow the project's public deployment docs and compare provider config with local required env and runtime settings   |

## Sign-off

Open the final message with one plain-prose sentence stating where the work stands now (e.g. "已提交并推送为 abc1234"), with the hash, tag, or blocker; then the status block below. A verdict buried under verification tables reads as unfinished and makes the user re-ask "都提交了吗"; the tables support the verdict, they do not replace it.

```
status:           [committed and pushed as <hash> / staged, not committed / released vX.Y.Z / blocked on <what>]
files changed:    N (+X -Y)
scope:            on target / drift: [what]
user-visible delta: none / [entry, UI, copy, behavior added, removed, or changed]
review depth:     quick / standard / deep
hard stops:       N found, N fixed, N deferred
sibling sweep:    N same-shape sites checked, N fixed / none found / not applicable
checklists:       [security, test] green/blocked or n/a
new tests:        N
public actions:   replied #N, closed #N, reactions done / none pending
doc debt:         none / AGENTS.md needs X / rules need Y
verification:     [command] -> pass / fail
```

`public actions` lists every outward-facing step the task implied (issue replies, closures, release reactions) with its done or pending state; an external action the user has to ask about was not finished.

For a whole-scope or post-fix verdict, `scope` is backed by the frozen baseline and current inventory, not by the last patch viewed. For a ship action, the status line is incomplete until every currently authorized ledger item is `done`, `not applicable`, or `blocked` with evidence.

A turn that wrote files ends with the actual output of `git status --short --branch` and, when it pushed, the `status,conclusion` of the CI run for that sha; if either command was not run, the first line says which.
