---
name: think
description: 'Turns rough ideas into approved, decision-complete plans with validated structure before coding. Use when users ask for a design direction, a worth-doing judgment on a feature, restructuring tangled modules, or triaging a bundle of mixed requests/feedback into accept/reject buckets. Not for bug fixes or small edits.'
when_to_use: '出方案, 要不要做, 可行性, architecture, design direction, feasibility, worth it, plan before build, should we keep this'
---

# Think: Design and Validate Before You Build

Turn a rough idea into an approved plan. No code, no scaffolding, no pseudo-code until the user approves.

Give opinions directly. Take a position and state what evidence would change it.

## Overview

Think turns rough ideas into approved, decision-complete plans before any code is written. It enforces grounding in current repo state, live docs, and official solutions rather than planning from memory.

## Outcome Contract

- Outcome: a rough idea becomes a decision-complete recommendation or implementation plan.
- Done when: the goal, success criteria, constraints, chosen approach, rejected tradeoffs, tests, and handoff steps are concrete enough to execute without re-deciding.
- Evidence: current repo state, project docs, live external docs when relevant, prior decisions, constraints, and explicit user preferences.
- Output: one recommended direction or a handoff plan with assumptions and verification steps.
- Authorization: planning only. Design approval does not authorize implementation, file writes, or public actions.

## When to Use

- Planning architecture, design direction, or feature feasibility before implementation.
- Evaluating whether something should exist, be kept, or be removed (Kill/Keep/Pivot).
- Triaging a bundle of requests or issues into actionable categories.
- Proposing approaches with rationale and rejected tradeoffs.
- Route to `hunt` for debugging and root-cause diagnosis; route to `check` for code review; route to `learn` for multi-source research; route to `pm` for product deliverables (PRD, backlog ranking, roadmap) and PM decision frameworks.

## Process

1. Pick the mode (Lightweight, Evaluation, Triage, or full planning) from the user's ask.
2. Ground the plan: read current repo state, project docs, prior decisions (skim matching ADRs/design docs if the project tracks them), and live external docs — never plan from memory.
3. Check for official/built-in solutions before proposing custom ones.
4. Propose one recommended approach with rationale, the most fragile assumption, and rejected tradeoffs.
5. Validate before handoff: test paths, rollback, dependencies — then get approval.

## Durable Context Preflight

When the user names memory, a prior decision, or a memory path, apply the project's durable-context rules (`rules/durable-context.md` when present): current repo state and live docs override memory; memory alone never authorizes state changes. Lock durable decisions and preferences before asking questions.

项目指令文件中的硬规则与计划冲突时，显式摆出冲突并停下问，不静默覆盖。

## Reference Library

Load the matching reference when the planning task enters that territory:

| When the ask involves                                                 | Load                            |
| --------------------------------------------------------------------- | ------------------------------- |
| Underspecified ask; need to extract what the user really wants        | `references/interview.md`       |
| Rough idea needing exploration / stress-testing before committing     | `references/idea-refine.md`     |
| New project/feature needing requirements written down before code     | `references/spec-mode.md`       |
| Value, viability, or keep/remove judgment about a single target       | `references/mode-evaluation.md` |
| A bundle of items to accept/reject ("are these worth doing")          | `references/mode-triage.md`     |
| A plan that must be decomposed into implementable tasks               | `references/task-breakdown.md`  |
| Framework-specific code that must match official docs                 | `references/source-driven.md`   |
| Choosing between a new library, a stdlib call, or a platform feature  | `references/platform-native.md` |
| Ranking several competing items where a gut verdict is not defensible | `references/prioritization.md`  |
| Designing APIs, module boundaries, or public interfaces               | `references/api-design.md`      |
| Designing or restructuring modules for testability and navigation     | `references/deep-modules.md`    |
| Project terminology being used loosely or named for the first time    | `references/domain-language.md` |
| A significant, hard-to-reverse architectural decision                 | `references/adr.md`             |

## Lightweight Mode

Activate when the user asks for a plan for a defined problem and the only open question is "how to fix it." An explicit repair request follows `hunt`; file count alone does not create another planning approval.

Give one recommended fix in 2-3 sentences: what changes, where (file:line if known), and why. Name the brute-force version in one line first; default to it unless the user wants elegance. List involved files, flag explicitly if more than 5. State one risk. Wait for approval before implementing.

Upgrade when you can name 3 approaches that differ in at least one of: data model, failure mode, or dependency surface.

For approach design, pressure testing, multi-perspective design, validation, simplicity gate, and handoff, load `references/idea-refine.md`.

## Common Rationalizations

- "I can plan from memory, I know the codebase" — repo state changes between sessions; always re-read before proposing.
- "A Phase 0 spike is part of the plan" — investigation belongs before the plan, not inside it; a plan with a spike is a plan that wasn't done yet.

## Red Flags

- Quoting a default value, env var, or config field from memory instead of opening the live config file
- Proposing a custom implementation before checking framework built-ins and official patterns against live docs
- Presenting a plan that failed an attack angle without disclosing the failure
- Treating design approval as implementation or public-action authorization
- Classifying a bundle item as a gap before grepping for the existing affordance

## Verification

1. Every step is concrete and executable by another engineer without re-deciding.
2. Validate Before Handing Off checklist: >8 files acknowledged, >3 components diagrammed, test paths listed, rollback checked.
3. Attack angles (when applicable): dependency failure, scale explosion, rollback cost all addressed.

## Hard Rules

- **No placeholders in approved plans.** Every step must be concrete before approval. Forbidden patterns: TBD, TODO, "implement later," "similar to step N," "details to be determined." A plan with placeholders is a promise to plan later.
- **Phase independence.** If the plan has multiple phases, each phase must be independently mergeable: after Phase N ships, the system is in a usable state, even if N+1 never lands. Plans that require all phases to complete before anything works are fragile (one stuck phase blocks the whole release) and waste review effort. If the work cannot be cut into mergeable phases, say so and ship it as one phase instead of pretending it is staged.
- **Plan red flags (self-check before handoff):** a phase depends on the next phase to be useful, or a "Phase 0: investigate / spike" exists (investigation belongs before the plan, not inside it). Either red flag means the plan is not ready; resolve it before handing off.

## Gotchas

| What happened                                        | Rule                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| User said "判断一下这个报错" and got Evaluation Mode | "判断一下" + error/bug context = debugging, route to `hunt`. Evaluation Mode is for value/existence judgments only |

## Output

**Approved design summary:**

- **Building**: what this is (1 paragraph)
- **Not building**: explicit out-of-scope list
- **Approach**: chosen option with rationale
- **Key decisions**: 3-5 with reasoning
- **Unknowns**: only items that are explicitly deferred with a stated reason and a clear owner. Not vague gaps. If an unknown blocks a decision, loop back before approval.

If the user only approves the design, end with the plan. If implementation is requested, follow Implementation Handoff instead of asking them to repeat the request.
