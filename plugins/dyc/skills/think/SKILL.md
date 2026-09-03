---
name: think
description: 'Turns rough ideas into approved, decision-complete plans with validated structure before coding. Use when users ask for planning, architecture, design direction, feasibility, value judgment, or whether a feature is worth doing before implementation, or triaging a bundle of mixed requests/feedback into accept/reject buckets. Not for bug fixes or small edits.'
when_to_use: "出方案, 给方案, 深入分析, 怎么设计, 用什么方案, 判断要不要做, 判断值不值得, 有没有必要, 值不值得, what's the best approach, plan this, how should I, should we keep this"
---

# Think: Design and Validate Before You Build

Put 🥷 at the very start of your first sentence (no blank line before it).

Turn a rough idea into an approved plan. No code, no scaffolding, no pseudo-code until the user approves.

Give opinions directly. Take a position and state what evidence would change it. Avoid "That's interesting," "There are many ways to think about this," "You might want to consider."

## Overview

Think turns rough ideas into approved, decision-complete plans before any code is written. It enforces grounding in current repo state, live docs, and official solutions rather than planning from memory.

## Outcome Contract

- Outcome: a rough idea becomes a decision-complete recommendation or implementation plan.
- Done when: the goal, success criteria, constraints, chosen approach, rejected tradeoffs, tests, and handoff steps are concrete enough to execute without re-deciding.
- Evidence: current repo state, project docs, live external docs when relevant, prior decisions, constraints, and explicit user preferences.
- Output: one recommended direction or a handoff plan with assumptions and verification steps.

## When to Use

- Planning architecture, design direction, or feature feasibility before implementation.
- Evaluating whether something should exist, be kept, or be removed (Kill/Keep/Pivot).
- Triaging a bundle of requests or issues into actionable categories.
- Proposing approaches with rationale and rejected tradeoffs.
- Route to `hunt` for debugging and root-cause diagnosis; route to `check` for code review; route to `learn` for multi-source research.

## Process

1. Pick the mode (Lightweight, Evaluation, Triage, or full planning) from the user's ask.
2. Ground the plan: read current repo state, project docs, prior decisions, and live external docs — never plan from memory.
3. Check for official/built-in solutions before proposing custom ones.
4. Propose one recommended approach with rationale, the most fragile assumption, and rejected tradeoffs.
5. Validate before handoff: test paths, rollback, dependencies, no placeholders, phase independence — then get approval.

## Durable Context Preflight

When the user names memory, a prior decision, or a memory path, apply the durable-context rules: current state wins over memory, memory is never authorization for state changes, and the redaction gate applies before any of it becomes a durable rule.

For `/think`: current repo state and live docs override memory. Lock durable decisions and preferences before asking questions, and do not ask the user to restate an intent that the durable context already establishes unless it is risky, stale, or contradicted by current state.

Before outputting any plan, scan any project-level agent instruction files present (`AGENTS.md`, `CLAUDE.md`, `.claude/rules/*`, `.codex/rules/*`, `.qoder/rules/*`, or equivalent), and any local agent-memory summary if the user pointed at one. If the proposed plan contradicts a "hard rule", "never X", "must Y", or "prefer Z" stated in those files, surface the contradiction in the plan output (one sentence: which rule, which step contradicts it, recommended resolution). Do not silently override the rule. If the rule blocks the plan, stop and ask before continuing.

## Reference Library

Load the matching reference when the planning task enters that territory:

| When the ask involves                                                | Load                            |
| -------------------------------------------------------------------- | ------------------------------- |
| Underspecified ask; need to extract what the user really wants       | `references/interview.md`       |
| Rough idea needing exploration / stress-testing before committing    | `references/idea-refine.md`     |
| New project/feature needing requirements written down before code    | `references/spec-mode.md`       |
| A plan that must be decomposed into implementable tasks              | `references/task-breakdown.md`  |
| Framework-specific code that must match official docs                | `references/source-driven.md`   |
| Choosing between a new library, a stdlib call, or a platform feature | `references/platform-native.md` |
| Designing APIs, module boundaries, or public interfaces              | `references/api-design.md`      |
| Designing or restructuring modules for testability and navigation    | `references/deep-modules.md`    |
| Project terminology being used loosely or named for the first time   | `references/domain-language.md` |
| A significant, hard-to-reverse architectural decision                | `references/adr.md`             |

## Lightweight Mode

Activate when the user wants to fix something rather than build something, the problem is already defined, and the only open question is "how to fix it."

Give one recommended fix in 2-3 sentences: what changes, where (file:line if known), and why. Name the brute-force version in one line first; default to it unless the user wants elegance. List involved files, flag explicitly if more than 5. State one risk. Wait for approval before implementing.

Upgrade when you can name 3 approaches that differ in at least one of: data model, failure mode, or dependency surface.

## Evaluation Mode

Activate when the user wants to judge whether something should exist, be kept, exposed, or removed. Typical triggers: "判断一下", "有没有必要", "值不值得", "should we keep this", "is this worth it", "我不想做", "商业前景", "有没有必要继续".

State the evaluation target and what kind of judgment is needed (value, risk, or tradeoff). Take a current-state snapshot: what it does, who uses it, what depends on it; grep and read before opining.

List every new or removed public surface before a **Keep** or **Pivot** verdict: settings, flags, environment variables, commands, services, tabs, routes, schemas, dependencies, public APIs, and long-lived helpers. Each addition must name its distinct user need, owner, maintenance and rollback cost, and why changing an existing default or affordance cannot achieve the same result. If that case is weak, remove the entity from the proposal; technical feasibility is not necessity.

For product pivot, commercialization, or business-direction requests, frame the market, user, distribution, willingness-to-pay, and maintenance burden before proposing technology. Do not assume open source, do not assume implementation comes first, and do not hide a business judgment inside a technical plan.

**Commercial readiness gate.** When the judgment is whether a product, paid feature, launch, or version is chargeable, evaluate chargeability before implementation. Check delivery and update path, first-run activation/onboarding, payment/license/trial boundary, privacy and network promises, headline-feature reliability and honest degradation, support/refund triggers, competitor wedge, and solo-maintainer maintenance burden. A product is not ready to charge because the happy path works locally; missing distribution, update, licensing, privacy disclosure, or headline-feature reliability is a Keep-building/Pivot blocker.

**Output format (Kill/Keep/Pivot):**

Line 1: one of **Kill** / **Keep** / **Pivot** as the verdict. No preamble.

Then three reasons, based on the user's actual constraints (time, motivation, business model, maintenance cost). Not generic tradeoffs.

Then state `Entity delta: +N / -N` and name any added public surface. `+0` is the preferred outcome when an existing default or path can carry the value.

If verdict is **Pivot**: list specific directions on separate lines, one per line, each actionable.

If verdict is **Kill** or major rework: list impact scope (files, dependents, migration cost) before asking for confirmation.

Do not use a build-plan template here. Do not list options. Give one verdict.

Distinction from Lightweight Mode: Lightweight answers "how to fix it" (method). Evaluation answers "should it exist" (value judgment).

## Triage Mode

Activate when the user forwards a bundle of asks: an issue with multiple requests, a batch of screenshots, a user saying "看看这几个需求", or any input containing 3+ distinct items that could each be accepted or rejected independently.

Do not treat the bundle as a to-do list. Classify each item first:

| Bucket                    | Meaning                                                        | Action                                                 |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Bug**                   | Broken behavior with evidence                                  | Fix                                                    |
| **Already works**         | The feature exists but the reporter missed it                  | Point to the existing affordance                       |
| **Accepted improvement**  | Genuine gap, low-risk, aligns with product direction           | Implement                                              |
| **Cosmetic / preference** | Subjective, no functional impact                               | Note it, do not implement unless the maintainer agrees |
| **Out of scope**          | Conflicts with product boundary or adds unjustified complexity | Decline with one sentence                              |

Output the classification table first. Wait for the user to confirm the accepted subset before implementing anything. "Already works" misidentified as missing is the most common waste; grep for the existing affordance before classifying an item as a gap.

**Negative-user feedback is not automatic scope.** Refund, churn, and "competitor X is more intuitive" complaints often land on deliberate product differentiation, not an oversight. Before converting the complaint into a rework plan, read the project's own docs for the criticized behavior named as a deliberate choice; if it is, the verdict is **Keep**, with one sentence on why the differentiation matters and a note that the maintainer can override. Do not write a "fix the friction" plan that quietly removes the differentiator.

## Before Reading Any Code

- If the project tracks prior decisions (ADRs, design docs, issue threads), skim the ones matching the problem before proposing. Skip if none exist.
- If the plan involves a default value, env var, or config field, open the project's actual config file (e.g. `app.config.json`, `tauri.conf.json`, `package.json`, `.env`) and lift the live value. Never quote a default from memory or docs.

## Check for Official Solutions First

Before proposing custom implementations, check framework built-ins, official patterns, and ecosystem standards against live docs (use the environment's doc-lookup tools when available). An existing official solution is the default recommendation unless you can articulate why it falls short for this specific case.

Climb in order and stop at the first rung that holds: an existing helper or pattern in this codebase → the standard library → a native platform feature (`<input type="date">` over a picker library, CSS over JS, a DB constraint over application code) → an already-installed dependency → only then, new code. Never propose a new dependency for what a few lines or a platform feature already covers.

For a hard problem, or one already tuned several times that still feels off, study how 2-3 mature open-source projects or direct competitors solve it before designing: read the actual implementation, extract the transferable mechanism, and name what you took from each. First-principles design next to a proven implementation discards the iterations someone else already paid for.

## Propose Approaches

Give one recommended approach with rationale. Include effort, risk, and what existing code it builds on. Mention one alternative only if the tradeoff is genuinely close (>40% chance the user would prefer it). Always include one minimal option.

Anything that asks a person to install or configure something (hook, MCP server, editor plugin, config key, pricing tier, per-day limit) is a setup cost paid by every user. Default to the zero-setup form: a built-in command plus a skill, a fixed sensible default, a doc line. Offer the setup-requiring form only after naming why the zero-setup one cannot do the job.

When the plan is about distilling lessons from one project into a reusable skill set or shared rules, split the plan into **promote** and **do not promote**. Promote only reusable workflow constraints. Explicitly reject project-specific commands, paths, release checklists, safety boundaries, and private local context unless the user asks to update that project itself.

For the recommendation, identify the most fragile assumption (premise collapse) and state it explicitly: "This plan assumes X. If X does not hold, Y happens." If the assumption is load-bearing and fragile, deform the design to survive its failure.

**Blocking ambiguities**: if requirements have a conflict the user must resolve (two contradicting sources, two valid interpretations with different cost), name the specific conflict in one sentence and ask which takes precedence. Do not silently pick.

**Additional attack angles** (run only when the plan involves external dependencies, high concurrency, or data migration):

| Attack angle       | Question                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| Dependency failure | If an external API, service, or tool goes down, can the plan degrade gracefully?        |
| Scale explosion    | At 10x data volume or user load, which step breaks first?                               |
| Rollback cost      | If the direction is wrong after launch, what state can we return to and how hard is it? |

If an attack holds, deform the design to survive it. If it shatters the approach entirely, discard it and tell the user why. Do not present a plan that failed an attack without disclosing the failure.

Get approval before proceeding.

## Multi-Perspective Plan Design (high-stakes only)

When the decision is expensive to reverse (new system, large refactor, irreversible schema or data decisions) and a subagent facility exists, replace single-line design with generate → critique → synthesize:

1. **Generate in parallel**: three read-only planning agents, each producing a complete plan from one perspective — simplicity & maintainability, performance & scalability, minimal change & risk reduction. Each plan must cite concrete file paths and name its key trade-off. Planning agents never modify files or run state-changing commands.
2. **Critique**: evaluate each plan on completeness (every requirement addressed), feasibility (realistic against the current codebase — verify by reading the critical files the agents named), risk (missed edge cases), and trade-offs.
3. **Synthesize**: take the strongest plan as the foundation, graft superior elements from the others, and record a Rejected Alternatives section with one-line reasons for each.

Skip this for routine tasks: one recommended approach plus one minimal option ([Propose Approaches](#propose-approaches)) remains the default. This mode exists for decisions where a wrong call costs more than three planning agents.

## Validate Before Handing Off

- More than 8 files or 1 new service? Acknowledge it explicitly.
- More than 3 components exchanging data? Draw an ASCII diagram. Look for cycles.
- Every meaningful test path listed: happy path, errors, edge cases.
- Can this be rolled back without touching data?
- Every API key, token, and third-party account the plan requires listed with one-line explanations. No credential requests mid-implementation.
- Every MCP server, external API, and third-party CLI the plan depends on verified as reachable before approval.

## Implementation Handoff

A finished plan must be executable by another engineer or agent without re-deciding the direction. Include:

- Scope and non-scope.
- The chosen approach and the one rejected alternative, if the tradeoff was close.
- Public API, schema, command, config, or file-interface changes, if any.
- Verification commands and manual acceptance checks.
- Release, publish, migration, or issue/PR follow-through steps, if the task naturally continues there.
- Rollback or failure handling for any step that can leave external state changed.

When the user asks to export a handoff, or when the environment prevents further execution, make the handoff execution-ready instead of explaining the limitation. Include file targets, key constants or selectors, exact commands, runtime or visual checklist, and risk boundaries. If the work depends on a screenshot or artifact, name the artifact and the pass/fail delta.

When the user sends an explicit go-ahead like "implement this plan" / "可以干" / "直接改" / "整" (a short imperative that names the plan or uses those exact verbs), treat that as approval of the written plan. Do not re-litigate the design. State which plan is being executed, check for obvious drift in the repo, and proceed. If the environment has changed enough that the plan is unsafe, name the specific drift and stop before editing.

## Common Rationalizations

- "I can plan from memory, I know the codebase" — repo state changes between sessions; always re-read before proposing.
- "A Phase 0 spike is part of the plan" — investigation belongs before the plan, not inside it; a plan with a spike is a plan that wasn't done yet.
- "The user said 'just do it' so I should implement" — `/think` is planning only; implementation starts when explicitly requested.

## Red Flags

- Quoting a default value, env var, or config field from memory instead of opening the live config file
- Proposing a custom implementation before checking framework built-ins and official patterns against live docs
- Presenting a plan that failed an attack angle without disclosing the failure
- Approving a plan that still contains TBD, TODO, or "details to be determined"
- Implementing inside `/think` after the user approved the design
- Classifying a bundle item as a gap before grepping for the existing affordance

## Verification

1. Every step is concrete (no TBD/TODO/placeholders) before approval.
2. Phase independence: each phase is independently mergeable; after Phase N ships, the system is usable.
3. Validate Before Handing Off checklist: >8 files acknowledged, >3 components diagrammed, test paths listed, rollback checked.
4. Attack angles (when applicable): dependency failure, scale explosion, rollback cost all addressed.

## Hard Rules

- **No placeholders in approved plans.** Every step must be concrete before approval. Forbidden patterns: TBD, TODO, "implement later," "similar to step N," "details to be determined." A plan with placeholders is a promise to plan later.
- **Phase independence.** If the plan has multiple phases, each phase must be independently mergeable: after Phase N ships, the system is in a usable state, even if N+1 never lands. Plans that require all phases to complete before anything works are fragile (one stuck phase blocks the whole release) and waste review effort. If the work cannot be cut into mergeable phases, say so and ship it as one phase instead of pretending it is staged.

## Gotchas

| What happened                                                       | Rule                                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| User said "just do it" or equivalent approval                       | Treat as approval of the recommended option. State which option was selected, finish the plan. Do not implement inside `/think`. |
| Rejected design restarted from scratch                              | Ask what specifically failed, re-enter with narrowed constraints                                                                 |
| User said "just fix X" and skipped /think                           | If the fix touches 3+ files or needs a method choice, pause and run Lightweight Mode                                             |
| Picked a regional or locale-specific API variant without checking   | List all regional or locale differences before writing integration code                                                          |
| Introduced a second language or runtime into a single-stack project | Never add a new language or runtime without explicit approval                                                                    |

## Output

**Approved design summary:**

- **Building**: what this is (1 paragraph)
- **Not building**: explicit out-of-scope list
- **Approach**: chosen option with rationale
- **Key decisions**: 3-5 with reasoning
- **Unknowns**: only items that are explicitly deferred with a stated reason and a clear owner. Not vague gaps. If an unknown blocks a decision, loop back before approval.

After the user approves the design, stop. Implementation starts only when requested.

## After Approval

When the plan is approved, output this guidance:

```
Plan approved. To implement, say "implement this plan". After implementation, run the check skill to review before merging or release follow-through.
```

Keep it concise (2-3 sentences max). The user decides when to start implementation.
