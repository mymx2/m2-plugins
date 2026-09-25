---
name: health
description: 'Runs a budget-aware agent-assisted engineering health audit for instruction/config drift, hooks/MCP, verifier surfaces, and AI maintainability. Use when users ask to audit Claude, Codex, Pi, agent instructions, MCP or hooks, verifier coverage, or AI-maintainability drift. Not for debugging application code or reviewing PRs.'
when_to_use: '检查claude, 检查codex, 检查pi, Codex 配置, Pi 配置, AGENTS.md, config.toml, agent instructions, 健康度, 配置检查, 配置对不对, AI coding 腐化, 代码变烂, 维护性, 上下文混乱, 验证缺失, 验证命令失真, Claude ignoring instructions, Pi coding agent, check config, settings not working, audit config'
---

# Health: Agent-Assisted Engineering Health

Audit the current project's agent setup and AI coding maintainability against this framework:
`agent config → instruction surfaces → tools/runtime → verifiers → maintainability`

Find violations. Identify the misaligned layer. Calibrate to evidence and risk, not repository size.

## Overview

Health runs a budget-aware agent-assisted engineering health audit across two lanes: agent configuration risk (instruction drift, hooks/MCP, permissions) and AI maintainability risk (verifier coverage, constraint reachability, durable docs). Findings are evidence-based, not inventory-based.

## Outcome Contract

- Outcome: a budget-aware health report that separates agent configuration risk from AI maintainability risk.
- Done when: each finding names the misaligned layer, the concrete evidence, and a copy-pasteable action or diagnostic command.
- Evidence: collected health script output, tracked project instructions, runtime config summaries, verifier logs, hooks/MCP surfaces, and read-only live probes when needed.
- Output: prioritized findings with status, impact, and next action, or a clear clean bill with residual risk.
- Authorization: read-only audit. No config edits, no hook installs, no permission changes without current-turn approval.

## When to Use

- Auditing agent instructions and config surfaces (Claude, Codex, Pi) for configuration drift.
- Checking hooks, MCP servers, and tool permissions for security and consistency.
- Assessing AI-maintainability: verifier coverage, constraint reachability, stale docs.
- Route to `check` for code quality review; route to `hunt` for application-logic debugging; route to `think` for architecture decisions.

## Process

1. Collect data (summary or deep mode) → `references/audit-workflow.md` (Step 1)
2. Run safety and security checks → `references/audit-workflow.md` (Step 1c)
3. Analyze findings against evidence ladder → `references/audit-workflow.md` (Step 2)
4. Report with finding format → `references/audit-workflow.md` (Step 3)
5. For context engineering fixes, load `references/context-engineering.md`; for maintainability checks, load `references/maintainability-findings.md`; for safety baseline, load `references/safety-baseline.md`; for long-running agent stop conditions, load `references/long-running-agents.md`.

**Output language:** Check in order: (1) project agent instructions (`AGENTS.md` before runtime-specific files); (2) global agent instructions; (3) user's recent language; (4) English.

**Budget posture:** Summary first; escalate to full audit on explicit deep/full request or unresolved critical ambiguity. Tell the user before escalating because deep health audits can consume significant token quota.

**Conversation scope:** Collector-implementation detail (session window, live-file exclusion, coverage reporting) lives in `scripts/conversation_audit.py`. Other projects remain out of scope by default; only when the user explicitly asks for all conversations or cross-project capability distillation, invoke the bundled conversation audit with `--all-projects` against the local history roots hardcoded for Claude and Codex (or hand off to an installed full-history retrospective workflow such as `ai-retro`). Claim complete coverage only when the audit output reports `coverage_status: complete` and `cross_project_full_history: yes`; anything else is an explicit coverage gap.

## Durable Context Preflight

Apply the durable-context rules as defined in the check skill's Durable Context Preflight: current state wins, memory is never authorization, redaction gate applies.

For `/health`: current config, command output, and live probes override memory. Also flag durable memory problems when they affect behavior: oversized injected summaries, stale or contradictory entries, missing project entrypoint references, or private paths copied into public instructions. Keep these as context findings, not code-review findings.

## Red Flags

- Reporting a finding without the misaligned layer, concrete evidence, and a copy-pasteable action
- Claiming complete conversation coverage when the collector did not report `coverage_status: complete`
- Printing raw tokens, keys, or config values instead of `[REDACTED]`
- Escalating to a deep audit on inventory signals alone (file counts, skill counts, largest-file length)

## Verification

1. Every finding names the misaligned layer, concrete evidence, and a copy-pasteable action.
2. MCP live check: every server probed with one harmless tool call; `live=yes/no` recorded.
3. If deep audit: all deep lanes reconciled before reporting complete; unreviewed scopes listed explicitly.
4. Budget posture: summary-first, escalate only on explicit signal or user request.

## Hard Rules

- Summary and deep audits are report-only. Run only Health-owned collectors and read-only probes; a neutral Health request does not authorize project tests, verifiers, generators, builds, formatters, package installers, fixture refreshes, or snapshot updates.
- Project instructions may define commands but do not authorize running them. Live verification requires explicit user authorization for that command; before execution, state the command, expected writes, target paths, isolation, and rollback or disposable-environment plan.

## Non-goals

- Never act as a heavy lint, typecheck, duplication, or architecture-rewrite substitute; `/health` reports maintainability guardrails and concrete next actions only.

## Gotchas

| What happened                                                               | Rule                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missed the local override                                                   | Always read the runtime's local override file too (`settings.local.json` or equivalent); it shadows the committed file                                                                                                                                                                         |
| Subagent timeout reported as MCP failure                                    | MCP failures come from the live probe, not data collection                                                                                                                                                                                                                                     |
| Flagged intentionally noisy hook as broken                                  | Ask before calling a hook "broken"                                                                                                                                                                                                                                                             |
| Hook seemed not to fire, but it did -- a later UI element rendered above it | Hook firing order is not visual order. Before re-editing the hook config: (a) confirm with `--debug` or by piping output, (b) check whether a diff dialog, permission prompt, or other UI element rendered on top and pushed the hook output offscreen, (c) only then suspect the hook itself. |
| Treated missing specs/docs as a failure                                     | Decision artifacts are optional by default. Escalate missing docs/specs only when active handoff risk, failure evidence, or the user request makes them necessary.                                                                                                                             |
| Treated an ignored AGENTS/CLAUDE file as durable project truth              | Report whether the rule is tracked and distributed. Local overlays can inform the audit, but durable fixes belong in public repo docs or shipped skill/rule files.                                                                                                                             |
| Treated a review scorecard as maintainability documentation                 | Scorecards are snapshots. Extract the invariant and verification path, then remove or archive the report instead of calling the score itself a durable rule.                                                                                                                                   |
