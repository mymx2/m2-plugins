# Interview Mode: Extract What the User Actually Wants

Activate when the ask is underspecified (missing _who_, _why_, _success_, or a binding _constraint_), when the user is conventional rather than specific ("build me a dashboard"), or when you'd otherwise silently fill in ambiguous requirements. Do not use for unambiguous, self-contained requests, or when the user explicitly wants speed over verification.

This mode needs a live, responsive user. Never invoke it in non-interactive contexts (CI pipelines, scheduled runs, autonomous loops) — flag an underspecified ask there as a blocker instead of guessing.

## Process

1. **Hypothesize first, with a confidence number.** Before asking anything, write your best one-sentence read of the intent plus an honest 0–100% confidence. Below ~70%, append one line on what's still missing. The number forces honesty.
2. **Ask one question at a time, each with a guess attached.** Format `Q: <one focused question>` / `GUESS: <your hypothesis + reasoning>`. Wait for the reaction before the next question. One-at-a-time beats batching: users react to a wrong guess faster than generating an answer from scratch, and it surfaces _your_ assumptions. The risk is a polite user agreeing with your guess to be agreeable — be visibly willing to be wrong, and occasionally guess in a direction you expect the user to push back on.
3. **Watch for "want vs. should want."** Answers that pattern-match best-practice talk ("scalable", "clean architecture", "the standard approach") signal the user is saying what a thoughtful answer sounds like. Probe with: _"If you didn't have to justify this to anyone, what would you actually want?"_
4. **Restate intent in the user's own words.** When confidence is high, write back 5–8 lines: Outcome / User / Why now / Success / Constraint / **Out of scope** (non-negotiable — half of misalignment is silent disagreement about what's _not_ built). Let them confirm or correct line by line.
5. **Confirm with an explicit yes.** "Whatever you think", "sounds good", and silence are not yes — the user is delegating or retreating, not converged. Re-ask with two concrete options as a choice.

## Stop Condition

You're done when you can answer yes to: _"Can I predict the user's reaction to the next three questions I would ask?"_ If you've gone several rounds and still can't predict, that's information about the ask — stop and tell the user something foundational is missing and offer to step back.

## Rationalizations

"Asking too many questions wastes their time" → the cost of 4–6 targeted questions is small; the cost of building the wrong thing is enormous, and the user bears it. "I'll figure it out as I build" → switching costs after code exists are 10x; discovery during implementation is rework.

## Red Flags

- Three or more questions in one message (batching, not interviewing)
- A question without a hypothesis attached (surveying, not committing)
- Accepting "whatever you think is best" as a terminal answer
- Producing a spec/plan/task list before the user confirmed your restate
- Persisting the restated intent (e.g. `docs/intent/[topic].md`) before the user has confirmed it
- Confidence flat after several rounds — ask different questions, not more questions
