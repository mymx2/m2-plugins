# Idea Refine: From Vague Idea to Actionable Concept

Canonical home of the think skill's Pressure Test: `SKILL.md` only offers and gates it (user-assent required); the four checks and verdict format live here — do not maintain a second copy in `SKILL.md`.

Activate when an idea is still vague, when you need to stress-test assumptions before committing to a plan, or when you want to expand options before converging. Works best as an interactive dialogue.

## Process

1. **Understand & Expand (divergent).** Restate the idea as a crisp "How Might We" problem statement. Ask 3–5 sharpening questions (who is this for specifically? what does success look like? real constraints? what's been tried? why now?). Then generate 5–8 idea variations using lenses: inversion, constraint removal, audience shift, combination, simplification (10x simpler), 10x version, expert lens. Ground variations in the actual codebase when one exists.
2. **Evaluate & Converge.** Cluster resonating ideas into 2–3 distinct directions. Stress-test each on user value (painkiller or vitamin?), feasibility (hardest part?), differentiation (would someone switch?). **Surface hidden assumptions** explicitly: what you're betting is true, what could kill the idea, what you're choosing to ignore.
3. **Sharpen & Ship.** Produce a concrete markdown one-pager: Problem Statement, Recommended Direction, Key Assumptions to Validate, MVP Scope, **Not Doing (and why)**, Open Questions.

## Rules

- The "Not Doing" list is mandatory in the one-pager — focus is saying no to good ideas.
- Persist the one-pager (e.g. `docs/ideas/[idea-name].md`) only after the user confirms the direction.

## Red Flags

- Jumping straight to the Phase 3 one-pager without running Phases 1 and 2

## Ideation Frameworks

Use these selectively — pick the lens that fits the idea, don't run every framework mechanically.

- **SCAMPER** — Substitute, Combine, Adapt, Modify (magnify/minimize), Put to other uses, Eliminate, Reverse/Rearrange. Best for improving/reimagining existing products.
- **How Might We (HMW)** — reframe a pain point as "How might we [outcome] for [user] without [constraint]?" Generate multiple framings; narrow enough to be actionable, broad enough for creative solutions, containing a tension. Best for unblocking solution-anchored thinking.
- **First Principles** — list what's actually true, then every assumption, challenge each ("law of physics or just how it's been done?"), rebuild from the truths. Best for escaping incremental thinking.
- **Jobs to Be Done (JTBD)** — focus on the functional/emotional/social job ("When I [situation], I want to [motivation], so I can [outcome]"). People hire products to do a job; the real competitor is the current workaround.
- **Constraint-Based** — impose time/feature/tech/cost/audience/scale constraints to force creative solutions. Best for cutting through complexity.
- **Pre-mortem** — imagine the project has already failed; list every plausible reason, classify each as preventable or idea-changing, decide which would kill it. Best for stress-testing ideas that feel good.
- **Analogous Inspiration** — find _structural_ similarities in other domains (a two-sided marketplace solving a trust problem, not "Uber for X").

## Answer Design Questions with Throwaway Prototypes

When a design question can't be settled by reasoning alone ("will this state model handle edge case X?", "which of these layouts works?"), build a cheap throwaway prototype to react to. Pick the branch by what's being asked:

**Logic / state question → single-file HTML demo.** One self-contained `.html` file (no framework, bundler, or server) that lets anyone drive the state model by clicking buttons. The actual logic lives in one pure `<script>` module (a reducer, state machine, or pure function set) with no DOM references — the page is a thin shell over it, so the validated module can be lifted into the real codebase later. Render the full current state after every click, offer free-play buttons per action plus tabbed guided walkthroughs for the awkward cases, and write every label in domain language so a non-developer can feel the model. State the question being answered at the top of the file.

**"What should it look like" question → `?variant=` multi-variant UI.** Generate ~3 structurally different variants (different layout, hierarchy, primary affordance — not just different colours), switchable from a floating bottom bar via a `?variant=` URL param. Prefer mounting variants on an existing route (real header/data/density beats a vacuum); only make a throwaway route if there's genuinely no host page. Keep variants independent enough to throw away; hide the switcher in production builds.

**Rules for both:** mark it throwaway; don't add tests, persistence, or polish; don't wire to a real database; don't generalise beyond the one question. Once the prototype answers its question, capture the answer (and the deciding snippet if it encodes the decision better than prose), fold the winner into real code, and move the throwaway onto a scratch branch — never ship prototype constraints (no tests, minimal error handling) into production.

## Refinement & Evaluation Criteria

Two tools for Evaluate & Converge beyond the step-2 stress test:

- **Assumption audit** — classify each assumption: **Must be true** (dealbreaker, validate first), **Should be true** (important, adjustable), **Might be true** (nice-to-have, defer).
- **Decision matrix** — high value + high feasibility = do first; high value + low feasibility = worth the risk; low value = skip. Use differentiation as the tiebreaker.

## Post-Convergence Four-Check Pressure Test

Run after a direction is chosen, before finalizing a high-stakes plan. `SKILL.md` offers and gates this test; this section is the canonical content.

1. **User match** — does this serve the users' highest-priority problem, or a secondary one? Would they recognize it as solving _their_ problem without explanation? Red flag: it solves an engineering problem, or requires users to change behavior significantly before benefiting.
2. **Job completeness** — walk the job-to-be-done step by step and show how the direction completes it. Is there a shorter path to the same job? If this direction did not exist, what would users do, and is that actually worse? Red flag: the job is vague enough to rationalize any direction.
3. **Key assumptions** — list the top 3 assumptions with confidence (high/med/low) and the cheapest test for each. The critical assumption is lowest confidence × highest cost of being wrong; name it as the first thing to test.
4. **Differentiation** — why build this instead of pointing users at an existing solution? What do the nearest 2-3 alternatives do here, and where is this meaningfully, defensibly different? Red flag: "we'll just do it better" is not differentiation.

Deliver a verdict, never a neutral summary: **holds** (proceed; name the top risk to retire first), **holds with conditions** (name the exact conditions that must be true and resolve them first), or **fundamental problem** (name which check killed it and what to rethink instead). A verdict you did not earn is worse than one that sends the direction back.

## Check for Official Solutions First

Before proposing custom implementations, check framework built-ins and official patterns against live docs — full process and source hierarchy in `references/source-driven.md`. Climb in order and stop at the first rung that holds: an existing helper or pattern in this codebase → the standard library → a native platform feature → an already-installed dependency → only then, new code. Never propose a new dependency for what a few lines or a platform feature already covers.

For a hard problem, or one already tuned several times that still feels off, study how 2-3 mature open-source projects or direct competitors solve it before designing: read the actual implementation, extract the transferable mechanism, and name what you took from each. First-principles design next to a proven implementation discards the iterations someone else already paid for.

## Propose Approaches

Give one recommended approach with rationale. Include effort, risk, and what existing code it builds on. Mention one alternative only if the tradeoff is genuinely close (>40% chance the user would prefer it).

Anything that asks a person to install or configure something (hook, MCP server, editor plugin, config key, pricing tier, per-day limit) is a setup cost paid by every user. Default to the zero-setup form: a built-in command plus a skill, a fixed sensible default, a doc line. Offer the setup-requiring form only after naming why the zero-setup one cannot do the job.

When the plan is about distilling lessons from one project into a reusable skill set or shared rules, split the plan into **promote** and **do not promote**. Promote only reusable workflow constraints. Explicitly reject project-specific commands, paths, release checklists, safety boundaries, and private local context unless the user asks to update that project itself.

For the recommendation, identify the most fragile assumption (premise collapse) and state it explicitly: "This plan assumes X. If X does not hold, Y happens." If the assumption is load-bearing and fragile, deform the design to survive its failure.

Run the **confidence check** on that load-bearing assumption and record the level in the plan: name the assumption, its evidence level (evidence-backed / reasoned but unvalidated / pure intuition), and the cheapest validation. Offer the validation before building when the level is below evidence-backed.

**Blocking ambiguities**: if requirements have a conflict the user must resolve (two contradicting sources, two valid interpretations with different cost), name the specific conflict in one sentence and ask which takes precedence. Do not silently pick.

**Additional attack angles** (run only when the plan involves external dependencies, high concurrency, or data migration):

| Attack angle       | Question                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| Dependency failure | If an external API, service, or tool goes down, can the plan degrade gracefully?        |
| Scale explosion    | At 10x data volume or user load, which step breaks first?                               |
| Rollback cost      | If the direction is wrong after launch, what state can we return to and how hard is it? |

If an attack holds, deform the design to survive it. If it shatters the approach entirely, discard it and tell the user why. Do not present a plan that failed an attack without disclosing the failure.

Get approval before proceeding.

## Pressure Test (optional, user-gated)

Before finalizing a high-stakes direction, offer the pressure test (defined in `references/idea-refine.md`): "I can stress this direction before we lock it. Want it?" Run it only on assent. When Multi-Perspective Plan Design below applies, it covers the same ground and replaces this test; for a direction that is high-stakes but cheap to reverse, run the pressure test alone.

## Multi-Perspective Plan Design (high-stakes only)

When the decision is expensive to reverse (new system, large refactor, irreversible schema or data decisions) and a subagent facility exists, replace single-line design with generate → critique → synthesize:

1. **Generate in parallel**: three read-only planning agents, each producing a complete plan from one perspective — simplicity & maintainability, performance & scalability, minimal change & risk reduction. Each plan must cite concrete file paths and name its key trade-off. Planning agents never modify files or run state-changing commands.
2. **Critique**: evaluate each plan on completeness (every requirement addressed), feasibility (realistic against the current codebase — verify by reading the critical files the agents named), risk (missed edge cases), and trade-offs.
3. **Synthesize**: take the strongest plan as the foundation, graft superior elements from the others, and record a Rejected Alternatives section with one-line reasons for each.

Skip this for routine tasks: one recommended approach ([Propose Approaches](#propose-approaches)) remains the default. This mode exists for decisions where a wrong call costs more than three planning agents.

## Validate Before Handing Off

- More than 8 files or 1 new service? Acknowledge it explicitly. (Threshold is a heuristic, not a hard limit.)
- More than 3 components exchanging data? Draw an ASCII diagram. Look for cycles.
- Every meaningful test path listed: happy path, errors, edge cases.
- Can this be rolled back without touching data?
- Every API key, token, and third-party account the plan requires listed with one-line explanations; if none, state N/A. No credential requests mid-implementation.
- Every MCP server, external API, and third-party CLI the plan depends on verified as reachable before approval.

## Simplicity Gate

Skip for one-file bug fixes or when the user explicitly chose the minimal option.

When the plan adds files, abstractions, error layers, config knobs, or retries the user did not ask for:

- **Minimal path:** the brute-force version in one line; the chosen plan must beat it on risk, rollback, or latency, not elegance.
- **Defensive layers:** every try/catch, retry, fallback, or flag maps to one named failure mode; delete layers that only "might" fail.
- **Surface delta:** list new commands, env vars, flags, or services; prefer +0 unless a user split needs a knob.
- **Compensating complexity:** if the plan is mostly workaround machinery around a misbehaving API, stop and change the approach — swap the container, restructure the layout, pick a different API — rather than building around the misbehavior.

If the gate fails, shrink the plan or switch to the minimal option before asking for approval.

## Implementation Handoff

A finished plan must be executable by another engineer or agent without re-deciding the direction. Include:

- Scope and non-scope.
- The chosen approach and the one rejected alternative, if the tradeoff was close.
- Public API, schema, command, config, or file-interface changes, if any.
- Verification commands and manual acceptance checks.
- Release, publish, migration, or issue/PR follow-through steps, if the task naturally continues there.
- Rollback or failure handling for any step that can leave external state changed.

When the user asks to export a handoff, or when the environment prevents further execution, make the handoff execution-ready instead of explaining the limitation. Include file targets, key constants or selectors, exact commands, runtime or visual checklist, and risk boundaries. If the work depends on a screenshot or artifact, name the artifact and the pass/fail delta.

When the user says "Implement the plan", "just do it", "可以干", "直接改", "整", or otherwise explicitly requests implementation, leave planning and execute the approved direction without another approval round. State which plan is being executed and check for repo drift; stop only if specific drift makes it unsafe. Approval of the design alone does not authorize implementation or public actions.
