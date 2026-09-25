# Failure Pattern Reference

Use this when a bug has repeated, a first fix did not hold, or the symptom smells like runtime state rather than local code syntax.

## Magic Number Tuning Past Round Three

Signals: a value adjusted three times still looks wrong; each tweak fixes one case and breaks another.
Checks: replace N independent values with one named token; asymmetry surviving tuning is structural.

## Stale Verifier Or Tool Cache

Signals: verifier points at deleted paths or old generated files; rerunning after clean checkout changes path but not code.
Checks: confirm path exists; clear cache only after proving path stale; re-run verifier from current repo root.

## Worker Queue Or DB Boundary

Signals: UI says work running but no worker processes it; scheduler active but no queued row.
Checks: trace request -> enqueue -> worker pickup -> persistence -> UI refresh; inspect queue rows directly; regression-test the enqueue boundary.

## Generated Rebuild Boundary

Signals: source changed but generated output, bundle, or artifact still contains old behavior.
Checks: identify source-to-artifact rule; verify build system watches source path; inspect artifact contents, not just source diff.

## Guard Lifetime Race

Signals: guard correct locally but delayed callback, relaunch, or alternate entry point bypasses it.
Checks: trace guard creation, retention, invalidation, and every entry point; verify cold/warm launch, deep link, retry; prefer durable state over transient flags.

## Atomic Temp Filename

Signals: concurrent runs collide, cleanup removes wrong file, or partially written output observed.
Checks: unique temp dirs or atomic rename; cleanup scoped to current run; test concurrent runs.

## Path, Cwd, Or Symlink Escape

Signals: operation touches sibling, follows symlink unexpectedly, or behaves differently from another cwd.
Checks: resolve canonical roots before writing/deleting; reject paths outside allowed root after symlink resolution; reproduce from non-default cwd.

## CLI Effect Scope Drift

Signals: preview/dry-run computed from one predicate, execution mutates broader or different set.
Checks: trace display, dry-run, mutation predicates to same source; compare planned vs executor input in regression test; assert partial failures report exact items.

## CLI Wrapper Or PATH Drift

Signals: source-tree invocation works, installed command or PATH shim runs old code or different binary.
Checks: inspect package contents, shebang, executable bit, wrapper target; reproduce through temp prefix; check PATH order.

## Interactive Stdin Or TTY Hang

Signals: CI stalls, spinner never finishes, subprocess reads script body, or auth prompt in non-interactive mode.
Checks: reproduce with stdin redirected and TTY/non-TTY separated; add test-mode/no-auth guards; stub external prompt tools through PATH.

## Subprocess Pipe Backpressure

Signals: child hangs only on large output; parent waits for exit before reading stdout/stderr.
Checks: drain stdout/stderr while running or inherit/redirect streams; test with output larger than pipe buffer; preserve stderr tails without holding whole stream.

## Signal Or Partial-Failure Mapping

Signals: cancel/timeout/SIGINT/SIGTERM reported as success or normal failure; temp files or locks make retries look complete.
Checks: classify interruption separately from success/expected failure; assert cleanup, lock release, log state after interruption; test retry/idempotency after partial write.

## CLI Stream Contract Regression

Signals: automation breaks after human logs, progress output, JSON shape, stdout/stderr routing, or exit-code changes.
Checks: assert exit code, stdout, stderr separately; keep human diagnostics off stdout for machine modes; snapshot/parse JSON output with non-interactive coverage.

## Snapshot Rebuild Drops Carried Field

Signals: live data arrives but downstream view empty; field has default value letting memberwise init compile without it.
Checks: trace every snapshot construction path passes the field; unit-test rebuild path asserts carried field equals input; prefer `with(...)` helpers over fresh memberwise init.

## Multi-Sample Command Cold Start

Signals: CLI with `-l N` returns one block of zeros and one of real data; aggregating all blocks yields zeros.
Checks: read man page for cold-start semantics; slice to latest sample; raise `-l` to 3 and confirm samples 2/3 agree.

## Locale-Dependent Subprocess Output

Signals: numbers parse correctly for author but wrong for some users; same parser already patched once for different field.
Checks: force fixed locale on every parsed subprocess (`LC_ALL=C`); fix at spawn boundary, not per call site; treat translated output as format change.

## Single-Probe Existence Check

Signals: "installed/running/registered" verdict wrong for subset of users, driving destructive or user-visible action.
Checks: list every legitimate existence form and confirm probe sees all; distinguish timeout from absent (timeout falls through, never to negative); false "absent" destroys data — require corroboration before destructive branch.

## Aggregation Key Variant

Signals: count short by entries sharing a trait; base-form key matches but derived variant silently dropped.
Checks: grep write sites and enumerate real variants; match with prefix/regex/variant list, not exact equality; add fixture row per known variant.

## Whole-Buffer Decode Collapse

Signals: parser works locally but returns nothing for user with accented/non-ASCII name; failure total, not partial.
Checks: find every strict decode of child-process/filesystem bytes (one invalid byte nils entire buffer); decode leniently for reports, strict only for signatures; check what empty result means downstream — guard reading empty list as "nothing running" fails open; real failure reported by exit status/timeout, not decode success.

## Denied Read Returns A Plausible Value

Signals: metric right for some subjects, wrong for others; split follows ownership. No error logged.
Checks: measure boundary — run call across owned/non-owned and count successes; check fallback carries same meaning as primary; prefer uniform source over silently degrading one.

## Recovery Gated On The Artifact It Restores

Signals: repair path reports same dead end no matter how many runs; broken state persists across reinstalls.
Checks: verify repair precondition is true in the broken state it fixes; verify every absolute tool path exists; assert observable end state, not source shape; repair must write artifact then prove it by querying system.

## Watchdog Tuned To The Fast Path

Signals: operation reported failed/stalled while healthy; from users on slow links/large payloads; retry fails at same elapsed time.
Checks: name slowest healthy case and confirm timeout clears it with margin; replace "no output for N seconds" with liveness probe; enumerate every exit from guarded region; check if second bound already covers hung run.

## Display-String Comparison

Signals: comparison on user-facing text produces verdict that never resolves; two sides format same value differently.
Checks: ask if format is contract or producer restyles at will; find machine-facing identity (build number, hash, id) and compare that; suppress verdict when token sequence identical but arrangement differs; fix every channel repeating the comparison.

## Entry-Point-Specific Initialization

Signals: works from app launch, breaks via file association, drag-drop, deep link, or external proxy.
Checks: reproduce using exact entry point; trace init path per entry point and confirm state ready before document handler.

## Fix Regressed the Default Path

Signals: fix matched reporter's setup but changed nothing for everyone else, or regressed default experience.
Checks: state whether fix changes default for all users or only reporter's config; prefer fixing default path — defect report is evidence, not full scope.

## Observation Log Gap

Signals: user counted N occurrences, log showed M, and the log won.
Checks: trust observation; treat gap as un-instrumented path; probe passing on happy path says nothing about failing one.

## Capability-Gated Surface

Signals: patched capability-gated feature on surface that never offered the capability.
Checks: confirm run surface supports capability before fixing; if not, say so and stop.

## Race Condition Misdiagnosed as Stale State

Signals: timing-sensitive issue diagnosed as stale-state bug.
Checks: inspect event timestamps/ordering before state; reproduce reliably before diagnosing — intermittent failure without repro is not stale-state.

## Pipeline Stage Reported Healthy While Upstream Misconfigured

Signals: stage reported healthy while upstream dependency misconfigured.
Checks: test each stage in isolation; trace data flow backward from failing stage.

## Theme/Mode/Locale Toggle Breaks State

Signals: broke after toggling theme/mode/locale; fine after restart.
Checks: trace toggle's recompute/invalidation route first; do not tune styles while state path broken.

## Build Passed But Rendered Surface Still Wrong

Signals: build passed but UI still looked wrong.
Checks: verify real rendered surface via Runtime Evidence Ladder; build pass proves compilation, not rendering.
