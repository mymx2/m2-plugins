# Test Coverage Review Checklist

Load and work this checklist when reviewing a change that implements logic, fixes a bug, or changes behavior. Tests are proof — "seems right" is not done.

## Review Checks

- [ ] Every new behavior has a corresponding test.
- [ ] Refactoring, infrastructure, and migration changes are covered by tests too (the Beyonce Rule: if you liked it, you should have put a test on it) — infrastructure is not responsible for catching your bugs, your tests are.
- [ ] Bug fixes include a reproduction test that failed before the fix (the Prove-It pattern).
- [ ] Tests assert outcomes (state), not implementation details (which methods were called).
- [ ] Tests are self-contained (DAMP over DRY) — each test tells a complete story without the reader tracing through shared helpers.
- [ ] Test names read like a specification (describe behavior, not "works" / "test 3").
- [ ] Tests use the repository's real test command and config, not a guessed default — the focused-test command during the loop, the full-suite command before completion (they are different commands).
- [ ] No test command was re-run on unchanged code — after a clean run, repeating the same command adds no information; run again only after edits that could affect the result.
- [ ] No tests were skipped or disabled to make the suite pass.
- [ ] Tests are placed per the project's conventions; coverage hasn't decreased (if tracked).
- [ ] The suite actually exercised the path — a "pass" from a skipped/empty run is a hollow green.

## Test Pyramid

- [ ] Unit tests (~80%) dominate; integration (~15%); E2E (~5%) limited to critical paths.
- [ ] Prefer real implementations > fakes > stubs > mocks; mock only slow/non-deterministic boundaries.

## Note

This checklist is the _review-time_ gate for test quality. The build-time TDD discipline (write the failing test _before_ the code) is enforced during implementation; here you verify the evidence exists and is sound. When a review finds the tests below were never run as a discipline, point the author at the build-time rules in the next section.

## Build-Time TDD Discipline

Load when reviewing tests that look bulk-written, tautological, or coupled to internals — these are the failure modes the build-time loop prevents. TDD is the red → green loop; this section is what makes that loop produce tests worth keeping.

**Test only at pre-agreed seams.** A seam is the public boundary where you observe behavior without reaching inside. Before any test is written, the seams under test should be named and confirmed with the user; no test is written at an unconfirmed seam. Agreeing seams up front is how testing effort lands on critical paths and complex logic instead of every edge case. When the seam shape is itself in question, load the `think` skill's `deep-modules` reference for the vocabulary.

**Rules of the loop:**

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage, not the red → green cycle.

**Three named anti-patterns** (each has a tell):

- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the DB instead of the interface). _Tell:_ the test breaks when you refactor but behavior hasn't changed.
- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`), so it passes by construction and can never disagree. Expected values must come from an independent source of truth: a known-good literal, a worked example, the spec.
- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior and go insensitive to real change. Work in vertical slices instead: one test → one implementation → repeat.
