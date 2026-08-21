# Idea Refine: From Vague Idea to Actionable Concept

Activate when an idea is still vague, when you need to stress-test assumptions before committing to a plan, or when you want to expand options before converging. Works best as an interactive dialogue.

## Process

1. **Understand & Expand (divergent).** Restate the idea as a crisp "How Might We" problem statement. Ask 3–5 sharpening questions (who is this for specifically? what does success look like? real constraints? what's been tried? why now?). Then generate 5–8 idea variations using lenses: inversion, constraint removal, audience shift, combination, simplification (10x simpler), 10x version, expert lens. Ground variations in the actual codebase when one exists.
2. **Evaluate & Converge.** Cluster resonating ideas into 2–3 distinct directions. Stress-test each on user value (painkiller or vitamin?), feasibility (hardest part?), differentiation (would someone switch?). **Surface hidden assumptions** explicitly: what you're betting is true, what could kill the idea, what you're choosing to ignore.
3. **Sharpen & Ship.** Produce a concrete markdown one-pager: Problem Statement, Recommended Direction, Key Assumptions to Validate, MVP Scope, **Not Doing (and why)**, Open Questions.

## Rules

- Be honest, not supportive. Push back on weak ideas with specificity and kindness. A good ideation partner is not a yes-machine.
- The "Not Doing" list is the most valuable part — focus is saying no to good ideas.
- Don't generate 20+ ideas; 5–8 considered variations beat 20 shallow ones.
- Don't skip "who is this for". Every good idea starts with a person and their problem.
- Don't produce a plan without surfacing assumptions — untested assumptions are the #1 killer of ideas.
- Don't just list ideas — tell a story. Each variation should have a reason it exists.
- Persist the one-pager (e.g. `docs/ideas/[idea-name].md`) only after the user confirms the direction.
- Don't over-engineer the process; three phases, each doing one thing well.

## Red Flags

- Generating many shallow variations instead of a few considered ones
- Skipping "who is this for"
- No assumptions surfaced before committing to a direction
- Yes-machining weak ideas instead of pushing back
- Jumping straight to the Phase 3 one-pager without running Phases 1 and 2
- Producing a plan without a "Not Doing" list

## Ideation Frameworks

Use these selectively — pick the lens that fits the idea, don't run every framework mechanically.

- **SCAMPER** — Substitute, Combine, Adapt, Modify (magnify/minimize), Put to other uses, Eliminate, Reverse/Rearrange. Best for improving/reimagining existing products.
- **How Might We (HMW)** — reframe a pain point as "How might we [outcome] for [user] without [constraint]?" Generate multiple framings; narrow enough to be actionable, broad enough for creative solutions, containing a tension. Best for unblocking solution-anchored thinking.
- **First Principles** — list what's actually true, then every assumption, challenge each ("law of physics or just how it's been done?"), rebuild from the truths. Best for escaping incremental thinking.
- **Jobs to Be Done (JTBD)** — focus on the functional/emotional/social job ("When I [situation], I want to [motivation], so I can [outcome]"). People hire products to do a job; the real competitor is the current workaround.
- **Constraint-Based** — impose time/feature/tech/cost/audience/scale constraints to force creative solutions. Best for cutting through complexity.
- **Pre-mortem** — imagine the project has already failed; list every plausible reason, classify each as preventable or idea-changing, decide which would kill it. Best for stress-testing ideas that feel good.
- **Analogous Inspiration** — find _structural_ similarities in other domains (a two-sided marketplace solving a trust problem, not "Uber for X").

## Refinement & Evaluation Criteria

Use during Evaluate & Converge; not every criterion applies to every idea.

- **User value** — painful or vitamin? Can you name 3 people with this problem now? What's the current workaround? Daily beats monthly. Pull vs. push. Red flag: "everyone could use this."
- **Feasibility** — does the core tech exist? hardest problem known-hard or novel? dependencies you don't control? minimum MVP stack? time-to-value in days/weeks, not months?
- **Differentiation** — _different_, not better. Strongest to weakest: new capability, 10x improvement, new audience, new context, better UX, cheaper. Is it durable (can't be copied in a week)? Red flag: "faster/cheaper/prettier" with no structural reason.
- **Assumption audit** — classify each assumption: **Must be true** (dealbreaker, validate first), **Should be true** (important, adjustable), **Might be true** (nice-to-have, defer).
- **Decision matrix** — high value + high feasibility = do first; high value + low feasibility = worth the risk; low value = skip. Use differentiation as the tiebreaker.
- **MVP scoping** — one job done well; test the riskiest assumption first; time-box not feature-list; the "Not Doing" list is mandatory; if it's not embarrassing, you waited too long.
