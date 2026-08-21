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

This checklist is the _review-time_ gate for test quality. The deeper build-time TDD discipline (write the failing test _before_ the code) is enforced during implementation; here you verify the evidence exists and is sound.
