# Definition of Done

A standing, project-wide bar every change clears before it counts as done. Applies to every task, unlike per-task acceptance criteria.

## Definition of Done vs. Acceptance Criteria

|         | Acceptance Criteria            | Definition of Done           |
| ------- | ------------------------------ | ---------------------------- |
| Scope   | Specific to one task or spec   | Applies to every increment   |
| Changes | Different for each item        | Fixed and reused             |
| Answers | "Did we build _this thing_?"   | "Is it _ready_?"             |
| Owner   | Defined when planning the task | Defined once for the project |

A task is done only when **its** acceptance criteria are met **and** the standing Definition of Done is satisfied.

## The Standing Checklist

### Correctness

- [ ] All acceptance criteria for the task are met
- [ ] Code runs and behaves as intended, verified at runtime, not just compiled/typechecked
- [ ] New behavior is covered by tests that fail without the change and pass with it
- [ ] Existing tests still pass; no regressions introduced
- [ ] Edge cases and error paths are handled, not just the happy path

### Quality

- [ ] Code reveals intent through naming and structure; no comments needed to explain _what_ it does
- [ ] No duplicated business logic
- [ ] No dead code, debug output, or commented-out blocks left behind
- [ ] Changes are scoped to the task; no unrelated refactors
- [ ] Linting and formatting pass

### Integration

- [ ] Change works with the rest of the system, not just in isolation
- [ ] Database migrations, config changes, and feature flags are accounted for
- [ ] Backward compatibility considered for any public interface or API change

### Documentation

- [ ] Public interfaces, APIs, and user-facing behavior are documented
- [ ] Architectural decisions worth preserving are recorded (see the `think` skill's adr reference)
- [ ] Documentation describes the current state in timeless language, not change history

### Ship-readiness

- [ ] Security implications reviewed for any untrusted input, auth, or data handling (see the `security-checklist` reference)
- [ ] Observability in place for new critical paths (see the `observability-checklist` reference)
- [ ] Rollback path exists for anything risky (see the `shipping` reference)
- [ ] The human has reviewed and approved before merge or deploy

## How to Apply

- **Per task:** confirm Correctness and Quality before checking the task off.
- **Per feature:** confirm Integration and Documentation.
- **Per release:** the full checklist is the floor; the `shipping` reference adds deploy-specific gates.

Tailor the list once, then reuse it unchanged. A Definition of Done renegotiated every sprint is not a Definition of Done.

## Red Flags

- "It's done, I just haven't run it yet": unverified work is not done.
- "Tests pass" used as a synonym for done while docs, regressions, or runtime verification are skipped.
- A different bar applied depending on deadline pressure.
- "Done" declared before human review on changes that need it.
