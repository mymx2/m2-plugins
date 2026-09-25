---
name: hunt
description: 'Finds the actual root cause of a failing test, error, crash, regression, or defect before applying fixes, proven against a known-good reference (prior version, build, or "good" screenshot). Use when users report errors, crashes, broken behavior, failing tests, or a used-to-work state that now fails, or ask why something throws or fails. Not for code review (route to check) or a first-impression visual complaint with no working baseline (route to ui).'
when_to_use: '排查, 报错, 崩溃, 不工作, 跑不通, 以前是好的, 回归, 截图回归, 和之前版本不一样, 判断错误原因, 反复修不好, debug, regression, used to work, broke after update, not working, fix error, stack trace'
---

# Hunt: Diagnose Before You Fix

A patch applied to a symptom creates a new bug somewhere else.

## Overview

Hunt enforces root-cause identification before any fix is applied: state a falsifiable hypothesis, probe it, then fix only what the evidence supports.

## Outcome Contract

- Outcome: the root cause is identified before any fix is applied.
- Done when: one sentence explains the cause, every observed symptom fits it, and the fix or handoff is verified against a reproducible check.
- Evidence: source trace, repro command or UI path, logs or state, targeted test/build output, and runtime evidence for UI or native defects (see Runtime Evidence Ladder).
- Output: root cause, fix or handoff, verification result, and any unswept sibling risks.
- Authorization: "diagnose", "investigate", "why", "look into", "排查", "看看", or equivalent is report-only. Apply a fix only when the current turn explicitly asks to fix, change, implement, or optimize; root-cause proof is still required first.

**Do not touch code until you can state the root cause in one sentence:**

> "I believe the root cause is [X] because [evidence]."

Name a specific file, function, line, or condition. "A state management issue" is not testable; "stale cache in `useUser` at `src/hooks/user.ts:42` because the dependency array is missing `userId`" is. Probes are chosen to kill or confirm the hypothesis, never open-ended exploration.

## When to Use

- Errors, crashes, regressions, failing tests, or broken behavior that need diagnosis.
- A current build that differs from a known-good reference (prior version, old build, fixture, or "good" screenshot).
- Native app freezes, rendering bugs, IME/Unicode issues.

## Diagnosis Signals

Hypothesis quality gate: the hypothesis must explain every observable symptom, not just the one reported first; partial coverage is a symptom-level guess, not a root cause. For timing-dependent issues (flicker, intermittent failure, race), reproduce reliably before diagnosing.

## Durable Context Preflight

When the user names memory, a prior decision, or a memory path, apply the project's durable-context rules (`rules/durable-context.md` when present): current state wins over memory, memory is never authorization, the redaction gate applies. Durable context is hypothesis fuel only — it never replaces a fresh root-cause sentence or a reproducible symptom list.

## Reference Library

Load the matching reference when the hunt enters that territory:

| When hunting                                                                            | Load                             |
| --------------------------------------------------------------------------------------- | -------------------------------- |
| A hard or non-reproducible failure; need reproduce→localize→reduce→fix→guard discipline | `references/debugging.md`        |
| A bug that runs in a browser (layout, console, network)                                 | `references/browser-devtools.md` |
| Native app freeze, beachball, not-responding, first-open lag, overlay lockup            | `references/native-freeze.md`    |
| Slow page load, poor Core Web Vitals, LCP symptoms with a live browser available        | `references/performance-lcp.md`  |
| High memory usage, OOM, or heap snapshot comparison (browser/Node.js)                   | `references/memory-leaks.md`     |
| Print/PDF rendering bugs (broken output, page breaks, font not rendering)               | `references/rendering-debug.md`  |
| IME, Unicode, character rendering, or text encoding bugs                                | `references/ime-unicode.md`      |

## Hard Rules

- **Same symptom after a fix is a hard stop; so is "let me just try this."** Both mean the hypothesis is unfinished. Re-read the execution path from scratch before touching code again.
- **After three failed hypotheses, stop.** Use the Handoff format below to surface what was checked, what was ruled out, and what is unknown. Ask how to proceed.
- **External tool failure: diagnose before switching.** When an MCP tool or API fails, determine why first (server running? API key valid? Config correct?) before trying an alternative.
- **System/tooling symptoms need a lower-layer baseline.** Before blaming the visible app, generated file, or top-level feature, measure the raw lower layer first: OS capture versus post-processing, runtime service versus UI, compiler versus test assertion, network/API versus client handling. Retire hypotheses the baseline disproves.
- **Visual/rendering bugs: static analysis first.** Trace paint layers, stacking contexts, and layer order in DevTools before adding console.log or visual debug overlays. Logs cannot capture what the compositor does.
- **Behavioral / lifecycle / async bugs: instrument as part of forming the hypothesis, not after a failed fix.** The moment the hypothesis involves "this callback fires before/after that one" or "this state should be X when Y runs", add the log before writing any fix. Two guesses without runtime evidence is the hard-stop signal.
- **Numeric tuning past round three is a structural bug — stop tuning and look for the missing constraint.**
- **Performance complaints need numbers.** Measure the baseline first (wall-clock time, profile sample, memory footprint), fix, then re-measure and report before/after numbers. "Feels faster" is not evidence.

## Fix Scope Discipline

A prerequisite refactor (e.g. a shared interface must change) needs a stated reason and the Authorization rule from the Outcome Contract; keep unrelated refactors separate.

## Bisect Mode

Activate when: "以前是好的", "之前是好的", "used to work", "上一次提交还是对的", "broke after update", or the user remembers a specific good commit or version. Bisect owns every case where a bisectable commit or version entry point exists.

- Protect the user's worktree first: `git status --short --branch -uall`. Any modified, staged, or untracked files mean no bisect in the current checkout: run it in a temporary detached worktree and remove that worktree when done. If a temporary worktree is impossible, stop and ask for explicit cleanup/stash approval.
- If the last-good version is only a few releases back, `git diff <last-good>..HEAD -- <suspect path>` first; fall through to bisect only when the diff is too large or the culprit is not obvious.
- Bisect only with a non-interactive pass/fail command defined up front, keeping bookkeeping in git (`git bisect good/bad`). When it names the culprit, read only that diff down to the specific line, then `git bisect reset` before removing the temporary worktree.
- The same black-box strategy applies when the search space is not commits: bisect the input file, the config matrix, or the environment. Halve the space with the same oracle, keep the half that still fails, stop at the minimal trigger.

## Repeated Regression / Screenshot Reference Mode

Activate when the user says the same issue is still wrong after a fix, provides a "good" screenshot/version/file, or describes a visual result as previously correct — and no bisectable commit entry point exists (if one does, use Bisect Mode).

Treat the reference as evidence, not decoration: list every symptom in the user's concrete words; identify the reference oracle (old build, fixture, screenshot, described expected state); define the pass/fail check before editing; then name the exact current-vs-reference delta. Do not generalize a visual defect into "style polish" when the evidence points to a broken render, race, font pipeline, or state path. If the same symptom survives an attempted fix, the Hard Rules apply.

## Scope Blast Mode

Activate after fixing a root-cause pattern, before declaring the bug done; also when the user says "举一反三" or "其他地方有没有同样问题". One local fix that ignores the blast leaves N - 1 bugs in the tree.

Extract the pattern signature (the specific function, regex, API call, CSS selector, lock acquisition, validation skip, or input boundary) and `grep -rn` it across the repo, excluding generated dirs, build output, and vendored deps; for class-of-bug patterns, grep the surrounding shape, not just the literal text. For every match, answer in writing: same bug / safe to leave (why) / unsure (ask the user). Do not claim "fixed" until the blast report is in the Output block. Unrelated bugs the sweep surfaces get listed, not fixed, unless the user agrees.

## Confirm or Discard

Run the one probe that would fail if the hypothesis were wrong, then read it. If the evidence contradicts the hypothesis, discard it completely and re-orient on what the probe just showed. Do not keep a hypothesis just because the code "looks like" the cause.

## Runtime Evidence Ladder

Use this ladder before claiming a bug is fixed:

1. Source trace: name the exact function, state transition, file, line, or condition that can produce the symptom.
2. Deterministic repro: run or write the smallest command, fixture, UI path, or scenario that produces it.
3. Logs/state/cache: inspect the runtime state that proves the path was reached.
4. Build/test: run the narrow test or build that exercises the fix.
5. Real runtime check: for UI, native app, browser, rendering, or visual bugs, open the app/page/artifact and verify the visible result. If impossible in this environment, say why and hand off the exact screen, command, or artifact to verify.

When the reporter's environment is the missing rung and cannot be reproduced locally, ship a read-only probe they can paste and run — printing environment, the disputed measurement, and hypothesis-relevant state, nothing secret-bearing. Discover their layout rather than hardcoding it. Two rounds of "could you check whether..." without a probe is the failure shape this replaces.

For recurring classes of failures, load `references/failure-patterns.md` before adding a second fix.

## Targeted Logging

Every log is a yes/no question: "if this prints X before Y, hypothesis A survives; otherwise A is dead." A log that cannot rule a hypothesis in or out is noise. Remove temporary logs before finishing; gate persistent diagnostics behind the project's debug flag. Full playbook: `references/logging-techniques.md`.

## Common Rationalizations

- "It works on my machine" — enumerate environment differences before dismissing; the reporter's environment is evidence, not noise.
- "One more restart should fix it" — read the last error verbatim; never restart more than twice without new evidence.

## Red Flags

- Editing code before stating the one-sentence root cause with a specific file, function, line, or condition
- Stacking a second fix onto a hypothesis the last probe already disproved
- Claiming "fixed" from a compile or test pass alone for a UI, rendering, or generated-artifact bug
- Declaring done without the Scope Blast sweep when the bug matches a class-of-bug pattern
- Quoting versions, function names, or file locations from memory instead of re-running the command
- Asking a third "could you check..." question instead of shipping a read-only probe the reporter can run

## Gotchas

| What happened                                                          | Rule                                                                        |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Patched the wrong layer (displayed surface instead of the data source) | Trace the execution path backward before touching any file                  |
| Stack trace points deep into a library                                 | Walk back 3 frames into your own code                                       |
| Changed the algorithm but the output stayed wrong                      | Invalidate or version-bump persisted output from the old code               |
| Reporter reproduces, local machine is fine, agent patched blind        | Produce one copy-paste diagnostic command first; diagnose from the evidence |

## Output

Close every hunt with one of the two formats below.

### Success Format

Open the wrap-up with one plain line stating the outcome and whether the changes are committed; the block supports that line, it does not replace it.

```
Root cause:        [what was wrong, file:line]
Fix:               [what changed, file:line]
Sibling sweep:     [N same-shape sites checked, N fixed / none found / not run, why]
Confirmed:         [evidence or test that proves the fix]
Tests:             [pass/fail count, regression test location]
Regression guard:  [test file:line] or [none, reason]
```

Status: **resolved**, **resolved with caveats** (state them), or **blocked** (state what is unknown).

**Regression guard rule**: for any bug that recurred or was previously "fixed", the fix is not done until a regression test lives in the project's test suite and a red-green run is recorded. Guard details: `references/debugging.md`.

### Handoff Format (after 3 failed hypotheses)

```
Symptom:
[Original error description, one sentence]

Hypotheses Tested:
1. [Hypothesis] → [Test method] → [Result: ruled out because...]
2. ...

Evidence Collected:
- [Log snippets / stack traces / file content]
- [Reproduction steps]
- [Environment info: versions, config, runtime]

Ruled Out:
- [Root causes eliminated]

Unknowns:
- [What is still unclear or missing]

Suggested Next Steps:
1. [Next investigation direction]
2. [External tools, permissions, or context needed]
```

Status: **blocked**
