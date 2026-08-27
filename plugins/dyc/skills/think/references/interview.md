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

## Round-Based Frontier Interviewing (multi-decision plans)

The linear mode above extracts a single intent. When the task is a plan or design with many interlocking decisions, switch to a frontier model: map the work as a **design tree** where every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the questions you can ask now without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait.

Format a round as:

```
Q1 — <question title>: <body, possibly multiple choices>
➡ <your recommended answer>

Q2 — <question title>: <body>
➡ <your recommended answer>
```

Each answered round reshapes the tree: settled decisions push the frontier outward and unblock dependent questions. Recompute and ask the next round. A question whose answer depends on another question still open this round belongs to a later round, not this one — that layering rule is what keeps rounds answerable.

**Finding facts is your job, never the user's.** When a frontier question needs a fact from the environment (filesystem, tools, docs), look it up or dispatch a subagent rather than asking the user for something you could find yourself. Don't block on it: treat a running lookup as an unsettled prerequisite, so only its downstream questions wait — ask the rest of the frontier now. The **decisions** are the user's; put each to them and wait.

Done when the frontier is empty: every branch visited, nothing silently assumed. Do not act until the user confirms you've reached a shared understanding.

## When the Answer Isn't in the Room

Sometimes the blocker isn't in the user's head or the codebase — it's in someone else's. When the user can't answer a frontier question alone, don't guess and don't stall: turn the gap into a short questionnaire for the one person who can fill it. Grill the **send**, not the subject — ask the user only what they can always answer (who it's going to, what they need back), then aim the document's questions at the gap between what that recipient knows and what the user needs. Order questions most-important-first (async means you may get one pass), one idea per question, each with a one-line _why this matters_ where it could be misread. The filled-in answers become material for the next round.
