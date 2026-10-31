# Simplification And Deletion: Remove Complexity

Load when reviewing code that works but is harder to read, maintain, or extend than it should be, or when the ask is "what can we delete", "能删什么", "是不是过度工程", or an over-engineering pass on a diff or repo. Two lenses share one rule set: simplification preserves behavior while improving readability and does not chase line count; deletion hunts removable complexity and does expect the code to get shorter.

## Simplification

### Five Principles

1. **Preserve behavior exactly.** Same inputs/outputs, side effects, error behavior, edge cases. If unsure a change preserves behavior, don't make it. All existing tests must pass without modification.
2. **Follow project conventions.** Match the codebase's style; simplification that breaks consistency is churn, not simplification.
3. **Prefer clarity over cleverness.** Explicit code beats compact code that needs a mental pause (dense ternary chains, chained reduces).
4. **Maintain balance.** Watch over-simplification: inlining too aggressively, combining unrelated logic, removing abstraction that exists for extensibility/testability, optimizing for line count.
5. **Scope to what changed.** Avoid drive-by refactors of unrelated code; unscoped simplification creates diff noise and regression risk.

### Process

1. **Understand before touching (Chesterton's Fence).** If you see a fence and don't understand why it's there, don't tear it down. Check git blame; understand the original context first.
2. **Identify opportunities** — deep nesting → guard clauses/helpers; long functions (50+) → split; nested ternaries → if/else or lookup; boolean param flags → options objects; repeated conditionals → a well-named predicate; duplicated logic → shared function; dead code → remove (after confirming); unnecessary abstractions → inline the pass-through wrapper; over-engineered patterns → direct approach; redundant type assertions → remove; generic names (`data`, `result`, `temp`) → descriptive names; non-universal abbreviations (`usr`, `cfg`, `evt`) → full words; misleading names (a `get` that mutates) → rename to actual behavior; comments explaining "what" → delete, "why" → keep.
3. **Apply one simplification at a time**, run tests after each. **Separate refactoring from feature work.** Rule of 500: a refactor touching >500 lines warrants automation (codemods/AST transforms), not hand edits.
4. **Verify the whole** — is it genuinely easier to understand? any new inconsistent patterns? would a teammate approve? If not, revert.

### Protect Hand-Tuned Blocks

Not everything should be simplified. Some code is hand-tuned for a reason — a performance-critical hot path, an unrolled XOR, an algorithm micro-optimized against profiling, a workaround for a platform quirk. When reviewing simplification:

- Before proposing to "clean up" a block, ask whether it is deliberately tuned. If it is, leave it alone and say so.
- Use `git blame` / comments to learn why a block looks the way it does (Chesterton's Fence). Code that reads "ugly" is often ugly on purpose.
- When you must simplify around a protected block, keep the block itself intact and only touch what the surrounding structure permits.
- If a codebase needs a persistent signal, a comment marker (e.g. `// simplify-ignore-start: perf-critical` ... `// simplify-ignore-end`) is an acceptable convention to protect known-fragile regions — but the review default is to recognize intent, not to require markers.

### Simplification Red Flags

- Simplification that requires modifying tests to pass (you changed behavior)
- "Simplified" code that's longer/harder to follow
- Removing error handling "because it makes the code cleaner"
- Simplifying code you don't fully understand
- Batching many simplifications into one large commit
- Refactoring outside the current task's scope

## Deletion Review

The reviewed code's best outcome is getting shorter.

### Hunt

1. Reinvented stdlib: a hand-rolled thing the standard library ships.
2. Platform bypass: a dependency or code doing what the native platform already does (`<input type="date">`, CSS over JS, DB constraints over application code).
3. Speculative abstraction: an interface with one implementation, a factory with one product, config nobody sets, a layer with one caller.
4. Dead weight: unused flags, dead code, wrappers that only delegate, files exporting one thing, dependencies with zero imports.
5. Same logic, fewer lines: a shorter form that introduces no new concepts.

Diff-scoped by default; for a whole-repo sweep, rank findings biggest cut first. For canonical substitutions when naming a `stdlib:` or `native:` replacement, the think skill's platform-native reference carries per-layer tables (HTML, CSS, JS/browser, Swift, Node, Python, database).

### Format

One line per finding: `L<line>: <tag> <what>. <replacement>.` (multi-file: `<file>:L<line>: ...`).

Tags:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

Bad: "This EmailValidator class might be more complex than necessary, have you considered whether all these rules are needed at this stage?"

Good: `L12-38: stdlib: 27-line validator class. "@" in email; real validation is the confirmation mail.`

### Verdict

End with `net: -<N> lines possible.` (whole-repo: `net: -<N> lines, -<M> deps possible.`). Nothing to cut: `Lean already. Ship.` — a clean pass is a valid result; do not manufacture cuts.

### Shortcut-marker Sweep

Scan the reviewed surface for shortcut markers (`TODO`, `FIXME`, `HACK`, `XXX`, project-specific debt tags). A marker that names no owner or revisit trigger is a rot risk: flag it `no-trigger` with file:line. A marker that names both its ceiling and its trigger ("global lock, per-account locks if throughput matters") is tracked debt, not a finding.

### Never Flag

Trust-boundary validation, error handling that prevents data loss, security measures, accessibility basics, the single runnable check guarding non-trivial logic, anything explicitly requested. Cutting any of these is damage, not deletion.

### Boundaries

List-only: apply nothing; fixes happen under explicit write authorization in the default review flow. Correctness, security, and performance findings are out of scope for this lens — route them to the default review pass.
