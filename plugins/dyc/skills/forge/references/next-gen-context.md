# Next-Generation Model Context Rules

Distilled from OpenAI and Anthropic engineering posts (2026): OpenAI removed most scaffolding assumptions for GPT-6 Astra; Anthropic deleted over 80% of Claude Code's system prompt with no measurable coding-eval loss. Both converged on the same conclusion: **next-generation models are overconstrained by instructions written for previous generations.**

The old model: exhaustive rules, examples, and guardrails to prevent worst-case behavior.
The new model: minimal, well-scoped guidance; trust the model's judgment.

Load this when auditing or rewriting an existing SKILL.md, AGENTS.md, or prompt scaffold — not when greenfield-authoring (write it right the first time instead).

## Six Paradigm Shifts

| Then (old model)                                                 | Now (next-gen)                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Give explicit rules against worst cases ("never write comments") | State intent; let judgment apply context ("write code that reads like the surrounding code")       |
| Worked examples for every tool/pattern                           | Expressive interfaces: parameter names, enums, constraints teach usage through structure           |
| Everything upfront in system prompt / root file                  | Progressive disclosure: root file is a minimal router; detail lives in references loaded on demand |
| Repeat instructions across system prompt and tool descriptions   | Single-source: each instruction stated once, closest to where it's used                            |
| Manual memory files (`# hotkey` to save context)                 | Auto-memory: models save relevant context across sessions themselves                               |
| Specs as plain Markdown plans                                    | Rich references: HTML artifacts, code, test suites, rubrics as high-fidelity specs                 |

## Audit Checklist

Apply each item as a deletion test. If deleting the rule would not cause a real mistake, delete the rule.

- [ ] **Description survives truncation.** Short enough that a runtime trimming it still routes correctly; trigger condition unambiguous; no overlap with sibling skills.
- [ ] **Root file is a router.** SKILL.md holds only enough to route; encyclopedia detail sits in `references/`.
- [ ] **Rule necessity.** Each rule prevents a real, current failure mode — not a compensated-for old-model limitation (e.g., "verify versions before claiming" — a current model greps by default).
- [ ] **Single source.** No rule stated twice across SKILL.md, references, and AGENTS.md. The strongest statement wins; the rest become pointers.
- [ ] **No contradictions.** Skill descriptions, AGENTS.md, and system prompt do not conflict (conflicts force the model to adjudicate instead of work).
- [ ] **Permission, not prohibition.** Boundaries for safe workflows stated as permission ("run tests freely, fix failures, rerun without asking") rather than prohibition ("never push without asking") — strong prohibitions cause next-gen models to stop work prematurely.
- [ ] **Completion defined.** For autonomous tasks, "done" includes verification steps (run, inspect, fix) so the model does not stop at first implementation.
- [ ] **Gotchas only.** AGENTS.md / rules files carry only non-discoverable information — not what the model can see from the file system.
- [ ] **Cross-model awareness.** Instructions tuned for one model must not overconstrain another; repository skills guide contributors' agents too.

## Description Precision

| Bad                                                                                                               | Good                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Create and validate Postgres schema migrations. Use when working with databases, queries, models, or persistence. | Create and validate Postgres schema migrations. Use when adding or changing a migration, or reviewing its rollout. |

The bad version fires on anything database-adjacent; the good version fires only on migration work. When many skills compete for one context window, an over-broad description pushes the model to load instructions that don't help the task.

## AGENTS.md Calibration

| Bad                                                                      | Good                                                                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Before every edit, read architecture.md, database.md, and deployment.md. | Use architecture.md for service boundaries, database.md for schema changes, and deployment.md when preparing a deployment. |

Forcing reads before every edit burns context and slows work. Point to docs only when the task needs them.

Grant permission for safe workflows explicitly:

> The local tests use disposable fixtures and have no production access. Run them, fix failures caused by the requested change, and rerun affected tests without asking for approval at each step.

## Context Stack

The assembled context window, most specific to most general: user prompt → references (@-mentioned files, specs, codebases, artifacts) → system prompt → CLAUDE.md / AGENTS.md → skills → memory. Each layer should be as light as possible; task-specific detail belongs in the prompt and references, cross-task guidance in the lower layers.

## Source

Distilled 2026-09-24 from:

- OpenAI — Eric Provencher, "Rethinking skills and prompts for GPT-6 Astra" (Sep 2026)
- Anthropic — Thariq Shihipar, "The new rules of context engineering for Claude 5 generation models" (Jul 2026)
