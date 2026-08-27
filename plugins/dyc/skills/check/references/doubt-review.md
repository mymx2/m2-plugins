# Doubt Review: Fresh-Context Adversarial Check

Load when reviewing a non-trivial decision whose correctness you can't fully verify from context — branching logic, cross-module boundaries, irreversible operations, or a claim about safety/idempotence/ordering. Complementary to the main review: this is an in-flight, biased-to-disprove check, not a final verdict.

A decision is **non-trivial** when it introduces/modifies branching logic, crosses a boundary, asserts a property the type system can't verify, its blast radius is irreversible (production deploy, data migration, public API change), or its correctness depends on context the reader can't see.

**When NOT to use:** mechanical operations, explicit unambiguous instructions, single-line changes, or when the user has asked for speed over verification. If you doubt every keystroke, you ship nothing — the bar is non-trivial decisions only.

## Process

1. **CLAIM** — name the decision in 2–3 lines plus why it matters. If you can't state it compactly, it's a vibe, not a decision.
2. **EXTRACT** — isolate the smallest reviewable unit (the diff/function + the contract it must satisfy). Strip your reasoning — handing over conclusions gets back validation of them.
3. **DOUBT** — invoke a fresh-context reviewer with an **adversarial** prompt: "Find what is wrong. Assume the author is overconfident. Look for unstated assumptions, edge cases, hidden coupling, contract violations, broken conventions, failure modes. Do NOT validate. Do NOT summarize." Pass **ARTIFACT + CONTRACT only, never the CLAIM** (biases toward agreement).
4. **RECONCILE** — the reviewer's output is data, not verdict. Re-read the artifact against each finding and classify in precedence order: contract misread (fix the contract) → valid + actionable (change, re-loop) → valid trade-off (document it) → noise (note it). Don't defer just because the reviewer is "fresh."
5. **STOP** — when the next iteration returns only trivial findings, after 3 cycles (escalate, don't grind a fourth), or on explicit user override.

## Rules

- Prompt with "find issues", never "is this good?"
- Prefer a different-architecture reviewer when available (shares fewer blind spots with the author).
- **Doubt theater**: if across 2+ substantive cycles zero findings were actionable, you're validating, not doubting — stop and escalate.
- Doubting only after committing is a final-verdict review, not this.
- Follow the security rules if the reviewer is an external CLI: verify it exists/works, confirm the exact invocation (stdin, not shell-interpolated), and never invoke without explicit user authorization.

## Loading Constraints

This reference is designed for the **main-session orchestrator**, where Step 3 can spawn a fresh-context reviewer.

- **Do not wire it into a persona's skill set.** A persona following Step 3 would spawn another persona — the nested-spawn anti-pattern forbidden by the `orchestration-patterns` reference.
- **Inside a subagent context** (nested spawn unavailable): prefer surfacing to the user that doubt review cannot run nested and let the main session handle it. As a last resort, a degraded self-questioning fallback exists — rewrite ARTIFACT + CONTRACT as a fresh self-prompt with a hard mental separator from your prior reasoning and walk Steps 1–5. This is not fresh-context review, so flag the result as degraded and prefer escalation whenever the user is reachable.

## Cross-Model Escalation

A single-model reviewer shares blind spots with the original author; a different-architecture model catches them.

- **Interactive sessions: always offer, never silently skip.** After the single-model review and before RECONCILE, ask: "Single-model review complete. Want a cross-model second opinion? Options: an external CLI, manual external review (you paste it elsewhere), or skip." The user — not the agent — decides whether the cost is worth it.
- **If the user picks a CLI — verify, then invoke.** Check the tool is in PATH; test it runs (`--version`) before passing the full prompt; confirm the exact invocation (flags, auth, env) with the user; pass ARTIFACT + CONTRACT + the adversarial prompt only. **Never interpolate the artifact into a shell-quoted argument** — write the prompt to a file and pipe it via stdin so backticks and `$(...)` stay inert. Use a read-only sandbox mode when the CLI offers one: a doubt artifact may itself contain instructions (prompt injection) that the CLI would otherwise execute against your workspace.
- **If the CLI is unavailable or fails**, surface it explicitly and offer alternatives — do not silently fall back to single-model.
- **If the user skips**, acknowledge it in the output ("Proceeding with single-model findings only"). Skipping is fine; silent skipping is not.
- **Non-interactive contexts** (CI, scheduled runs, autonomous loops): cross-model is skipped and the skip is announced ("Cross-model skipped: non-interactive context"). Never invoke an external CLI without explicit user authorization.

## For Context

- This is the same spirit as the main review's Adversarial Pass (Deep) and per-finding skeptic, but applied in-flight to a single decision rather than a whole diff.
- A failing test produced by TDD is doubt made concrete — it can satisfy the fresh-context requirement for behavioral claims.
