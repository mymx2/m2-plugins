# Simplification: Reduce Complexity, Preserve Behavior

Load when reviewing code that works but is harder to read, maintain, or extend than it should be. Goal is not fewer lines — it's code a new team member understands faster than the original.

## Five Principles

1. **Preserve behavior exactly.** Same inputs/outputs, side effects, error behavior, edge cases. If unsure a change preserves behavior, don't make it. All existing tests must pass without modification.
2. **Follow project conventions.** Match the codebase's style; simplification that breaks consistency is churn, not simplification.
3. **Prefer clarity over cleverness.** Explicit code beats compact code that needs a mental pause (dense ternary chains, chained reduces).
4. **Maintain balance.** Watch over-simplification: inlining too aggressively, combining unrelated logic, removing abstraction that exists for extensibility/testability, optimizing for line count.
5. **Scope to what changed.** Avoid drive-by refactors of unrelated code; unscoped simplification creates diff noise and regression risk.

## Process

1. **Understand before touching (Chesterton's Fence).** If you see a fence and don't understand why it's there, don't tear it down. Check git blame; understand the original context first.
2. **Identify opportunities** — deep nesting → guard clauses/helpers; long functions (50+) → split; nested ternaries → if/else or lookup; boolean param flags → options objects; repeated conditionals → a well-named predicate; duplicated logic → shared function; dead code → remove (after confirming); unnecessary abstractions → inline the pass-through wrapper; over-engineered patterns → direct approach; redundant type assertions → remove; generic names (`data`, `result`, `temp`) → descriptive names; non-universal abbreviations (`usr`, `cfg`, `evt`) → full words; misleading names (a `get` that mutates) → rename to actual behavior; comments explaining "what" → delete, "why" → keep.
3. **Apply one simplification at a time**, run tests after each. **Separate refactoring from feature work.** Rule of 500: a refactor touching >500 lines warrants automation (codemods/AST transforms), not hand edits.
4. **Verify the whole** — is it genuinely easier to understand? any new inconsistent patterns? would a teammate approve? If not, revert.

## Protect Hand-Tuned Blocks

Not everything should be simplified. Some code is hand-tuned for a reason — a performance-critical hot path, an unrolled XOR, an algorithm micro-optimized against profiling, a workaround for a platform quirk. When reviewing simplification:

- Before proposing to "clean up" a block, ask whether it is deliberately tuned. If it is, leave it alone and say so.
- Use `git blame` / comments to learn why a block looks the way it does (Chesterton's Fence). Code that reads "ugly" is often ugly on purpose.
- When you must simplify around a protected block, keep the block itself intact and only touch what the surrounding structure permits.
- If a codebase needs a persistent signal, a comment marker (e.g. `// simplify-ignore-start: perf-critical` ... `// simplify-ignore-end`) is an acceptable convention to protect known-fragile regions — but the review default is to recognize intent, not to require markers.

## Red Flags

- Simplification that requires modifying tests to pass (you changed behavior)
- "Simplified" code that's longer/harder to follow
- Removing error handling "because it makes the code cleaner"
- Simplifying code you don't fully understand
- Batching many simplifications into one large commit
- Refactoring outside the current task's scope
