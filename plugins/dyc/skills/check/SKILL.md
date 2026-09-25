---
name: check
description: 'Reviews code diffs, PRs, release readiness, and project or document audits, then reports evidence-grounded findings. Use when users ask for code review, issue or PR triage, release gates, project scorecards, security/performance/coverage review, or doc proofreading. Not for debugging root causes (hunt) or drafting prose (write).'
when_to_use: 'review, 看看代码, 检查一下, 有没有问题, 是否需要优化, 合并前, 继续优化, 优化代码, 看看issue, 看看PR, release, publish, push, release reaction, GitHub reaction, 发布, 提交, 关闭issue, 发布表情, release表情, close issue, issue close, review my code, check changes, before merge, before release, 值得发布, ready to release, code review, audit, project audit, 项目体检, 项目评分, 给项目打分, 深入分析项目代码, 评估项目质量, 代码质量评分, scorecard, linus review, rate this codebase, score this project, 安全审查, 安全加固, security review, 性能检查, performance review, 测试覆盖, test coverage, 可观测性, observability, review docs, 审稿, 文档检查, writing review, proofread files'
---

# Check: Review Before You Ship

> Note: this skill is named `check`. Some runtimes alias it as `code-review`. Do not invoke any other review command from inside this skill.

## Overview

check is the last gate between code and users. It reads diffs, PRs, issues, releases, and documents, then produces findings grounded in evidence from the current session — never from memory or inference alone.

## Outcome Contract

- Outcome: a review, release decision, or maintainer action grounded in the current diff, project context, and live evidence.
- Done when: findings, fixes, shipped state, or blockers are stated with the commands, artifacts, or remote state that prove them.
- Evidence: worktree status, diff, public project docs, manifests, CI, package contents, release or registry state, and current command output.
- Output: concise findings first, then verification and shipped-state summary when applicable.
- Authorization: read-only intent may inspect the worktree and remote state but may not edit files, apply autofixes, commit, push, publish, comment, close, merge, or change branches. Each write or public action needs current-turn authorization, except when the user explicitly authorizes a named batch that contains it.

## When to Use

- Code review, PR review, issue triage, release readiness, project audit, or document proofreading requests
- Route to `/think` when the user needs planning before review
- Route to `/hunt` when the regression point itself is unknown
- Route to `/health` when the user wants ongoing monitoring rather than a point-in-time review

## Worktree Safety Preflight

Before any review, triage, ship, release, or PR operation, read the current worktree with:

```bash
git status --short --branch -uall
```

Treat modified, staged, and untracked files as user work. Do not move, hide, overwrite, clean, or discard them without explicit approval in the current turn. If a branch change or cleanup is genuinely required, stop and ask. When a clean tree is required, use a separate worktree from a known commit.

For commit or push follow-through in a dirty or multi-agent checkout, record `git rev-parse HEAD` before staging, re-read `git status` and `git rev-parse HEAD` immediately before commit and again before push. If HEAD moved or the worktree changed outside your intended files, stop and report.

For PR inspection, prefer commands that do not switch the current working tree: `gh pr view`, `gh pr diff`, `git fetch origin pull/<n>/head:refs/tmp/pr-<n>`, and `git merge-tree`.

## Mode Picker

Pick the mode that matches the user's intent, then read it in full before acting. Modes layer on top of the shared review surface (Scope, Hard Stops, Autofix, Specialist Review, Verification, Sign-off) further down, which applies in every mode. Load a mode file only when its row matches; the default review path needs none of them. Mode Picker rows are mutually exclusive; Conformance checklists stack by the surfaces the diff touches; Review References load on demand.

| User intent                                                                                    | Mode                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| "implement this plan", `/think` output handed off                                              | load `references/mode-ship.md` (Plan Execution Mode)                      |
| Diff or PR ready, "review", "看看代码", "合并前"                                               | Default review (start at Get the Diff in `references/review-patterns.md`) |
| "能删什么", "过度工程", "over-engineering review", "what can we delete"                        | load `references/deletion-review.md`                                      |
| "look at issues", "review PRs", "triage", "批量处理"                                           | load `references/mode-triage.md`                                          |
| "is this worth a release", "值不值得发版"                                                      | load `references/mode-ship.md` (Release Worthiness Analysis)              |
| "commit", "push", "publish", "release", "close issue", "发布表情"                              | load `references/mode-ship.md` (Ship / Release Follow-through)            |
| "audit", "项目体检", "项目评分", "给项目打分", "深入分析项目代码", "scorecard", "linus review" | load `references/mode-audit.md`                                           |
| Document, PDF, prose review                                                                    | load `references/writing-review.md`                                       |

Before any mode, run [Project Context Extraction](#project-context-extraction) and (if memory is in scope) [Durable Context Preflight](#durable-context-preflight).

## Project Context Extraction

Before reviewing, extract project constraints from repository context:

1. Read the diff and identify changed languages, frameworks, manifests, generated outputs, release files, and CI workflows.
2. Inspect public project files only as needed: README, AGENTS/CLAUDE instructions, package manifests, lockfiles, build/test configs, workflow files, release notes.
3. Compress the findings into review context: verification commands, protected or generated files, release artifacts, domain risks, public reply rules.
4. Apply the stricter rule when project context and this skill overlap. If project docs or CI name a verification command, prefer it over auto-detection.

For the context shape, see `references/project-context.md`. For release or maintainer work, also fill the Release Gate 2.0 matrix there; missing matrix evidence is a blocker for a "ready to release" claim.

## Durable Context Preflight

When the user names memory, a prior decision, or a memory path, apply three durable-context rules: **current state wins** over memory; **memory is never authorization** for a state change; **the redaction gate** — a memory item becomes a durable project rule only after secrets, private paths, and one-off identifiers are stripped.

For `/check`: public project rules come from README files, manifests, CI workflows, release docs, and explicit instructions in the current thread. Never cite private memory as a public project requirement.

## Review Flow Pointers

`references/review-patterns.md` sections, by need: baseline resolution (Get the Diff), depth classification (Scope Classification), scope drift (Scope Drift Detection), approach-level verdicts (Question the Approach, Not Just the Diff), behavior contract impact (Behavior Contract Impact), pattern-fix completeness (Pattern-Fix Completeness).

## Red Flags

- Writing "I verified" or "tests pass" without the shell output in the current transcript
- Signing off while any delegated review pass or verification command is still pending
- Manufacturing findings to justify the invocation — a clean review with zero findings is a valid output
- Publishing or shipping over your own open findings without explicit "known, shipping anyway" confirmation
- Stating "all read" or "full audit complete" while delegated scopes remain unreviewed

## Hard Stops (fix before merging)

Examples, not exhaustive -- flag any diff that could cause irreversible harm if merged unreviewed.

- **No unverified claims.** Do not write "I verified X", "I ran Y", "tests pass", or "this fixes Z" unless the shell output is in this turn's transcript. If you reason about behavior without running, say "based on reading the code" instead of "I verified".
- **Re-read source-of-truth facts.** Refresh line numbers, worktree state, fallback behavior, locale coverage, and artifact state in the current turn before citing them. Earlier context and reviewer notes are leads, not evidence.
- **Destructive auto-execution**: any task marked "safe" or "auto-run" that modifies user-visible state (history files, config, preferences, installed software) must require explicit confirmation.
- **Source and distribution out of sync**: everything the source change implies downstream must be regenerated, tracked, uploaded, and version-consistent before declaring done: generated outputs rebuilt, every artifact named in release notes or workflows uploaded, every new helper/reference/script present in the built archive, version fields synchronized across manifests, changelogs, tags, and lockfiles.
- **Verifier failure layer unclear**: classify setup failure (missing optional deps, bootstrap noise, transient crashes, unavailable simulators) versus product failure before calling the repo broken; the intended test body or artifact check must actually run. The inverse is the same stop: a hollow green — a skipped job that still prints OK, an early-return leaving output empty so a true-on-empty assertion passes, a render reported fixed but never opened — is not a pass. A pass counts only when at least one non-skipped, non-empty case exercised the path.
- **Publishing over your own open findings**: when the same run produced review findings and then reaches a ship action, every finding must be fixed or restated as "known, shipping anyway" with user impact confirmed before the release proceeds.
- **Security findings gate the handoff** — full protocol in `references/security-checklist.md` (Security Handoff Gate).
- **Injection and validation**: SQL, command, path injection at system entry points; credentials hardcoded, logged, committed, or copied into public docs — see `references/security-checklist.md`.
- **Dependency changes**: unexpected additions, version bumps, or declared-but-unused entries in package.json, Cargo.toml, go.mod, requirements.txt — flag to the maintainer; removal needs current-turn approval, a zero-reference grep, and a full build. Verify lockfile consistency in the project's declared environment per `references/review-quality.md` (Dependency Discipline).
- **Safety sinks**: destructive file operations, shell or AppleScript construction, cwd/path/symlink traversal, approval or sandbox boundary changes, signing/appcast flows, and auth prompts — reviewed per `references/project-context.md` (Safety Sink Review), the canonical procedure.

## Finding Quality Gate

Before writing any finding into the report, run this gate:

**Pre-report self-check (four questions, every finding must pass):** Can I cite the exact file:line? Can I describe the specific input or state that triggers the bad outcome? Have I read the upstream callers / downstream consumers, not just the function in isolation? Is the severity defensible — would a senior reviewer raise this at this level in a real PR?

If any answer is "no", drop the finding or downgrade it to advisory.

Finding titles stand alone and lead with the consequence. Counts, absences, and similarities to known-bad patterns are leads to verify, not findings — promote one only with a live trigger path.

**HIGH and CRITICAL require three pieces of evidence:** the exact file:line where the bug lives; the specific trigger; and why existing guards (validation, type system, upstream catch, framework default) do not already prevent it. Cannot supply all three? Downgrade to MEDIUM, or drop.

## Conformance Review

Beyond correctness, run the domain checklists when the diff touches the relevant surface:

| Diff touches                                                                              | Load checklist                          |
| ----------------------------------------------------------------------------------------- | --------------------------------------- |
| User input, auth, data storage, external integrations, uploads, payments, PII, LLM output | `references/security-checklist.md`      |
| Logic, bug fixes, behavior changes, or new features                                       | `references/test-checklist.md`          |
| Load time, interaction, data fetching, queries, bundle                                    | `references/performance-checklist.md`   |
| Production features, I/O, retries, queues, cross-service calls                            | `references/observability-checklist.md` |

Name which checklists you ran in the sign-off and mark each green/blocked. If none apply, state `conformance: n/a`. A clean pass is a valid result.

## Review References

Load the matching reference when the review enters that territory:

| When reviewing                                                                                              | Load                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Findings need sharpening, severity labels, change sizing, dependency discipline, stale or drifting comments | `references/review-quality.md`                                                                                                          |
| Code works but is over-complicated or hard to read                                                          | `references/simplification.md`                                                                                                          |
| An in-flight single decision needs adversarial, fresh-context checking (not the whole-diff deep pass)       | `references/doubt-review.md`                                                                                                            |
| Commits, branching, or release/versioning decisions                                                         | `references/git-workflow.md`                                                                                                            |
| Drafting a maintainer reply on a public issue or PR (triage or ship follow-through)                         | `references/public-reply.md`                                                                                                            |
| CLI entrypoint, installer, completion, config/env, or mutating command (cleanup/update/uninstall/migration) | `references/release-surfaces.md` (CLI Command Surface); after changing CLI-facing text, re-run the command and read the real output     |
| Skill, plugin, marketplace entry, package allowlist/manifest, generated mirror, or published archive        | `references/release-surfaces.md` (Packaged Install Surface); manifest JSON or source tests never substitute for installed-runtime proof |
| Build/deploy pipeline changes or automated checks                                                           | `references/ci-cd.md`                                                                                                                   |
| Release-worthiness or launch readiness beyond the basic gate                                                | `references/shipping.md`                                                                                                                |
| A multi-file or multi-slice change (scope/feature-flag/rollback discipline)                                 | `references/incremental-guardrails.md`                                                                                                  |
| Removing an API/feature, migrating consumers, or a schema change                                            | `references/migration.md`                                                                                                               |
| The standing project-wide bar every change clears before done                                               | `references/definition-of-done.md`                                                                                                      |
| Concrete JS/TS testing syntax (Jest, RTL, Supertest, Playwright)                                            | `references/testing-patterns.md`                                                                                                        |

## Knowledge Sync

When a finding recurs, or the diff introduces an invariant not yet in project docs, load `references/knowledge-sync.md` and promote it to a durable rule. Sign-off reports `doc debt: none` when no new invariant exists.

## Specialist Review (Standard and Deep only)

Specialist reviewers are harness-provided agent definitions; this skill ships none. When the environment provides registered specialists, dispatch the activated ones with the full diff; otherwise run the domain passes yourself through [Conformance Review](#conformance-review).

Merge findings: two passes flagging the same code location keep the higher severity; different locations are never duplicates.

Every pass finding is a claim to verify, not a fact. For HIGH and CRITICAL claims, re-read the cited code this turn and confirm the claim is real and live; drop what dissolves on direct read, and cite the verification path before routing anything to Autofix or sign-off.

Wait for every active pass before a whole-scope verdict, or name its scope as unreviewed.

## Autofix Routing

| Class        | Definition                                     | Action                                                                                             |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `safe_auto`  | Unambiguous, risk-free (typos, imports, style) | Apply only after explicit write authorization; otherwise report it                                 |
| `gated_auto` | Behavior fix with clear intended result        | Apply within explicit repair authorization; ask only for scope expansion or unresolved user choice |
| `manual`     | Architecture or security tradeoff              | Resolve from project context; present any remaining user decision                                  |
| `advisory`   | Informational only                             | Note in sign-off                                                                                   |

Write authorization covers necessary fixes within its scope. A routing class does not create another approval step. In report-only mode, do not modify the worktree.

Any fix made during review invalidates the pre-fix verdict. Re-freeze the baseline, re-run the check that exposed the finding, refresh the sibling sweep, and complete the final adversarial pass required by the review depth before declaring ready.

## Adversarial Pass (Deep only)

"If I were trying to break this system through this specific diff, what would I exploit?" Four angles: assumption violation, composition failures, cascade construction, abuse cases. Run each angle blind to the others' findings. Suppress any finding that cannot supply the three pieces of evidence required of HIGH/CRITICAL findings (see Finding Quality Gate).

## Verification

When project docs or CI name a verification command, run that command. Otherwise run `bash <skill-base-dir>/scripts/run-tests.sh` from the target project root (auto-detects the project's test command). Report exit status and summary, with failure output rather than full passing logs.

A failed check needs diagnosis; no detected command is a discovery gap, not proof of failure. Inspect project docs, manifests, and CI for an appropriate check. Block a fix or readiness claim only when required evidence is missing or failing.

For bug fixes: a regression test that fails on the old code must exist before the fix is done.

In a dirty or multi-agent checkout, a passing local run is not proof: unrelated WIP can supply missing symbols or mask a break. Verify in isolation — `git worktree add --detach <known-good-commit>`, `git apply` only your diff, then build/test there.

## Gotchas

| What happened                                                | Rule                                                                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Public reply went to the wrong thread, or read like a report | Follow `references/public-reply.md` — the single source for public reply rules                                       |
| Deployed without provider runtime or env checks              | Follow the project's public deployment docs and compare provider config with local required env and runtime settings |

## Sign-off

Open the final message with one plain-prose sentence stating where the work stands now (e.g. "已提交并推送为 abc1234"), with the hash, tag, or blocker; then the status block below. A verdict buried under verification tables reads as unfinished; the tables support the verdict, they do not replace it.

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

`public actions` lists every outward-facing step the task implied (issue replies, closures, release reactions) with its done or pending state.

**Derive every count from the findings, never estimate.** If the stated count and the listed findings disagree, the findings win and the count gets recomputed.

For a whole-scope or post-fix verdict, `scope` is backed by the frozen baseline and current inventory, not by the last patch viewed. Multi-step or ship-action runs close with a numbered completion ledger (done / not applicable / remaining) covering every delegated review and currently authorized step; never say "all read", "full audit complete", or "no issues" while any pass or required verification is still pending.

A turn that wrote files ends with the actual output of `git status --short --branch` and, when it pushed, the `status,conclusion` of the CI run for that sha; if either command was not run, the first line says which.
