# Deletion Review: Find What to Cut

Loaded from `check` Mode Picker when the ask is "what can we delete", "能删什么", "是不是过度工程", or an over-engineering pass on a diff or repo. This lens hunts removable complexity only. Its sibling, the simplification reference, improves readability while preserving behavior and explicitly does not chase line count; this one does.

The reviewed code's best outcome is getting shorter.

## Hunt

1. Reinvented stdlib: a hand-rolled thing the standard library ships.
2. Platform bypass: a dependency or code doing what the native platform already does (`<input type="date">`, CSS over JS, DB constraints over application code).
3. Speculative abstraction: an interface with one implementation, a factory with one product, config nobody sets, a layer with one caller.
4. Dead weight: unused flags, dead code, wrappers that only delegate, files exporting one thing, dependencies with zero imports.
5. Same logic, fewer lines: a shorter form that introduces no new concepts.

Diff-scoped by default; for a whole-repo sweep, rank findings biggest cut first. For canonical substitutions when naming a `stdlib:` or `native:` replacement, the think skill's `platform-native` reference carries per-layer tables (HTML, CSS, JS/browser, Swift, Node, Python, database).

## Format

One line per finding: `L<line>: <tag> <what>. <replacement>.` (multi-file: `<file>:L<line>: ...`).

Tags:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

Bad: "This EmailValidator class might be more complex than necessary, have you considered whether all these rules are needed at this stage?"

Good: `L12-38: stdlib: 27-line validator class. "@" in email; real validation is the confirmation mail.`

## Verdict

End with `net: -<N> lines possible.` (whole-repo: `net: -<N> lines, -<M> deps possible.`). Nothing to cut: `Lean already. Ship.` — a clean pass is a valid result; do not manufacture cuts.

## Shortcut-marker Sweep

Scan the reviewed surface for shortcut markers (`TODO`, `FIXME`, `HACK`, `XXX`, project-specific debt tags). A marker that names no owner or revisit trigger is a rot risk: flag it `no-trigger` with file:line. A marker that names both its ceiling and its trigger ("global lock, per-account locks if throughput matters") is tracked debt, not a finding.

## Never Flag

Trust-boundary validation, error handling that prevents data loss, security measures, accessibility basics, the single runnable check guarding non-trivial logic, anything explicitly requested. Cutting any of these is not deletion, it is damage.

## Boundaries

List-only: apply nothing; fixes happen under explicit write authorization in the default review flow. Correctness, security, and performance findings are out of scope for this lens — route them to the default review pass.
