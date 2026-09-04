---
name: health
description: 'Runs a budget-aware agent-assisted engineering health audit for instruction/config drift, hooks/MCP, verifier surfaces, and AI maintainability. Use when users ask to audit Claude, Codex, Pi, agent instructions, MCP or hooks, verifier coverage, or AI-maintainability drift. Not for debugging application code or reviewing PRs.'
when_to_use: '检查claude, 检查codex, 检查pi, Codex 配置, Pi 配置, AGENTS.md, config.toml, agent instructions, 健康度, 配置检查, 配置对不对, AI coding 腐化, 代码变烂, 维护性, 上下文混乱, 验证缺失, 验证命令失真, Claude ignoring instructions, Pi coding agent, check config, settings not working, audit config'
---

# Health: Agent-Assisted Engineering Health

Prefix your first line with 🥷 inline, not as its own paragraph.

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

## When to Use

- Auditing agent instructions (Claude, Codex, Pi) for configuration drift.
- Checking hooks, MCP servers, and tool permissions for security and consistency.
- Assessing AI-maintainability: verifier coverage, constraint reachability, stale docs.
- Route to `check` for code quality review; route to `hunt` for application-logic debugging; route to `think` for architecture decisions.

## Process

Two lanes share one report:

- **Agent config health**: agent-runtime instruction drift (Claude, Codex, Pi, or whichever runtime is active), permissions, hooks, MCP, skills, and memory supply chain.
- **AI maintainability health**: non-obvious constraint reachability, risk-backed hotspot ownership, verifier coverage, generated-artifact checks, and stale or misleading durable docs.

**Output language:** Check in order: (1) project agent instructions (`AGENTS.md` before runtime-specific files); (2) global agent instructions; (3) user's recent language; (4) English.

**Budget posture:** Start with the summary audit. Escalate automatically when the user asks for a deep, full, complete, thorough, "深入", "完整", "彻底", or "继续跑完" audit, when the user explicitly mentions AI coding code rot, Codex/Claude config drift, unclear context, missing verification, verifier output that points at stale paths, or "代码变烂", when current project instructions or remembered user preference says to run deep health checks by default, or when the summary pass exposes a critical ambiguity that cannot be resolved locally. File counts, contributor counts, skill counts, and large files are inventory signals only; none automatically trigger a deeper audit or a finding. Otherwise do not read sampled conversation extracts or work the deep lanes. Tell the user before escalating because deep health audits can consume significant token quota.

**Conversation scope:** Summary scans up to three recent previous sessions for the current project across the installed agent runtimes from a bounded candidate window when those local histories exist. Deep streams every previous current-project session across those runtimes for signals while printing only bounded extracts and a coverage receipt. Other projects remain out of scope by default. Only when the user explicitly asks for all conversations or cross-project capability distillation, invoke the bundled conversation audit with `--all-projects` against the supported local history roots discovered for that runtime (or hand off to an installed full-history retrospective workflow such as `ai-retro`). The explicit global mode excludes files modified in the last five minutes as potentially live and redacts emitted text. Claim complete coverage only when the audit output reports `coverage_status: complete` and `cross_project_full_history: yes`; anything else is an explicit coverage gap.

## Durable Context Preflight

When the user names memory, a prior decision, or a memory path, apply the durable-context rules: current state wins over memory, memory is never authorization for state changes, and the redaction gate applies before any of it becomes a durable rule.

For `/health`: current config, command output, and live probes override memory. Also flag durable memory problems when they affect behavior: oversized injected summaries, stale or contradictory entries, missing project entrypoint references, or private paths copied into public instructions. Keep these as context findings, not code-review findings.

## Reference Library

When the audit finds the project's agent context is poorly set up (no rules file, context starvation/flooding, drift), load `references/context-engineering.md` for the fix guidance.

## Red Flags

- Reporting a finding without the misaligned layer, concrete evidence, and a copy-pasteable action
- Flagging an `(unavailable)` section as a defect instead of insufficient data
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

## Step 0: Establish the evidence basis

Do not grade a repository by file count, contributor count, skill count, the presence of a project map, or the length of its largest file. Record four evidence classes instead:

| Evidence                    | Question                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Risk**                    | Which paths can lose data, spend money, publish or deploy, cross trust boundaries, or create hard-to-reverse state?                 |
| **Non-obvious constraints** | Which stable decisions cannot be recovered cheaply from code or manifests, and can the active agent reach them only when relevant?  |
| **Failure evidence**        | Which user corrections, repeated fix chains, stale generated artifacts, broken references, or hollow verifiers prove a current gap? |
| **Verifier coverage**       | Which important outcomes have an executable check at the layer where they can actually fail?                                        |

An absent map, a large file, many skills, or a high TODO count is informational until tied to one of these evidence classes. Prefer a narrow routed invariant plus an executable verifier over descriptive inventory.

## Evidence Ladder and Finding Qualification

Grade every configured capability on a four-rung ladder, and never award credit above the rung the evidence supports:

| Rung                  | Meaning                                                | Example                                                      |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Present**           | The asset exists on disk                               | hook configured, rule written, verifier script present       |
| **Wired**             | It is connected to the runtime that should trigger it  | hook registered in settings and actually loaded              |
| **Exercised**         | It ran on a real event in the observed window          | hook fired on an actual edit; verifier ran in CI             |
| **Outcome-supported** | Its output changed a decision or caught a real failure | verifier blocked a bad merge; hook prevented a secret commit |

A configured capability is not an exercised behavior. Presence is inventory; only the Exercised and Outcome-supported rungs justify claiming a guardrail works. A setup that is Present-only cannot earn a "healthy" verdict no matter how complete the inventory looks.

Finding qualification: counts, absences, similarities to known-bad patterns, and future risks are leads, not findings. A candidate promotes to a finding only with evidence of a current consequence, an explicit stated requirement, or a demonstrated present defect. Leads worth chasing get named as leads; leads not worth chasing get dropped silently rather than padded into the report.

## Step 1: Collect data

Run the collection script in summary mode first. Do not interpret yet. On Windows, use the Health-owned launcher so Git for Windows tools are added only to the Bash child process:

```powershell
$HEALTH_LAUNCHER = "<skill-base-dir>/scripts/run-health.ps1"
if (-not (Test-Path -LiteralPath $HEALTH_LAUNCHER -PathType Leaf)) {
  throw "Health launcher not found under the installed skill base; reinstall the health skill."
}
$POWERSHELL = Join-Path ([Environment]::SystemDirectory) "WindowsPowerShell\v1.0\powershell.exe"
& "$POWERSHELL" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$HEALTH_LAUNCHER" collect
```

`-ExecutionPolicy Bypass` applies only to this PowerShell process; do not change
the user's machine or account execution policy.

On Linux and macOS, keep the direct Bash flow:

```bash
HEALTH_SCRIPT="<skill-base-dir>/scripts/collect-data.sh"
if [ ! -f "$HEALTH_SCRIPT" ]; then
  echo "health collect-data.sh not found under the installed skill base; reinstall the health skill"
  exit 1
fi
BASH_ENV= ENV= /bin/bash -p "$HEALTH_SCRIPT"
```

Sections may show `(unavailable)` when tools are missing:

- trusted `python3` missing → conversation, MCP/hooks/allowedTools, and skill-security sections unavailable
- `settings.local.json` absent → hooks/MCP may be unavailable (normal for global-only setups)

Treat `(unavailable)` as insufficient data, not a finding. Do not flag those areas.

Before analyzing, confirm `audit_root` in `PROJECT SIGNALS` is the intended project. The collector audits the current working directory and does not guard against the wrong root; a run in the wrong directory produces a plausible but misleading report.

The collector includes both runtime-specific and agent-agnostic surfaces:

- `AGENT CONFIG SUMMARY` / `AGENT CONFIG DETAIL` for Codex, Claude, Pi, and project instruction files.
- `AI MAINTAINABILITY SUMMARY` / `AI MAINTAINABILITY DETAIL` for project signals, verification surface, generated mirrors, wrappers, and doc links.

## Step 1b: MCP Live Check

Test every MCP server: call one harmless tool per server. Record `live=yes/no` with error detail. Respect `enabled: false` (skip without flagging). For API keys, only check if the env var is set (`echo $VAR | head -c 5`), never print full keys.

## Step 1c: Safety and security checks

These run after collection and before the Step 2 analysis. The first two apply to every audit; the third only to projects with long-running or autonomous agents.

### Security Baseline Checks

Run these on every audit. They are the floor, not the ceiling. Load `references/safety-baseline.md` and work its three checks: deny-list floor, permission-layer vs instruction-layer gating, and environment override surface.

### Memory and Skill Supply Chain

Treat agent memory and third-party skills as supply-chain artifacts. They run with the user's privileges.

**Memory hygiene.** Audit the project's long-term agent memory store for secrets, tokens, or credentials (Critical), and for entries written by untrusted runs (subagent invoked on attacker-controlled input, /loop iteration over external content); recommend rotation after such runs. For high-risk one-off runs (untrusted PDFs, uncontrolled scraping, third-party scripts), recommend disabling memory persistence for that session entirely.

**Skill supply chain.** Third-party skills, plugins, and MCP servers run with the user's privileges. For each one not authored in this repo, check: source pinned to a release tag or revision (not `main`, a branch, or a remote git marketplace left tracking its latest head), hook handlers do not write to credential directories, MCP servers have explicit user consent (not auto-trusted by wildcard). Report unpinned sources or unreviewed hook handlers as Structural, not Critical, unless an active exploit signal is present.

### Long-Running Agent Stop Conditions

For projects that use `/loop`, autonomous agents, or any long-running agent flow, load `references/long-running-agents.md` and audit the four hard stop signals it lists. Projects without such a flow skip this check.

## Step 2: Analyze

Analyze locally from the summary output by default. If the user asks for a deep/full/thorough audit, remembered preference requires it, the request explicitly targets AI maintainability, or local analysis cannot classify a material security/control ambiguity, re-run collection with `& "$POWERSHELL" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$HEALTH_LAUNCHER" collect auto deep` on Windows, or `BASH_ENV= ENV= /bin/bash -p "$HEALTH_SCRIPT" auto deep` on Linux and macOS. Then work the deep lanes: context + security; control + behavior; and, only for deep health audits or explicit code-rot/AI-maintainability requests, AI maintainability. Inspector agents are a vendor customization, not skill content; when the harness provides none, run the lanes sequentially in-session. Redact credentials to `[REDACTED]`.

Before reporting a deep audit as complete, reconcile every lane's assigned scope. If one remains uncovered, list that scope as unreviewed instead of issuing a whole-scope clean bill.

## Step 3: Report

**Health Report: {project} ({summary|deep}, evidence-based)**

**Global findings report once.** Findings in machine-global config (`~/.claude`, `~/.codex`, global rules, skills, memory) are not project findings: label them `global`, report each once with its fix, and recommend one dedicated session for global cleanup instead of re-fixing per project. Before editing any global file, re-read its current state: when health runs across several projects in one day, another session may already have fixed or be mid-fix on the same file, and re-applying a variant of the same rule creates duplicate entries. Never edit the same global file from two concurrent sessions.

### [PASS] Passing checks (table, max 5 rows)

List the checks that passed, one per row, capped at five; fold refuted candidates here instead of reporting them.

### Finding format

```
- [severity] <symptom> ({file}:{line} if known)
  Why: <one-line reason>
  Action: <exact command or edit to fix>
```

`Action:` must be copy-pasteable. Never write "investigate X" or "consider Y". If the fix is unknown, name the diagnostic command.

Every finding line passes the reader-value gate: **standalone** (the reader understands it without the `Why:` line), **consequence-first** (the harm leads, not the mechanism), **reader language** (no internal taxonomy or inspector jargon), **evidence-bounded** (states only what the cited evidence shows — no extrapolation to unmeasured surfaces).

A finding refuted in the same breath (a TODO count that turns out to be vendored code or false positives) is not a finding; drop it or fold it into the passing table.

### [!] Critical -- fix now

Rules violated, dangerous allowedTools, MCP overhead >12.5%, security findings, leaked credentials.

Example:

- [!] `settings.local.json` committed to git (exposes MCP tokens)
  Why: leaked token enables remote code execution via installed MCP servers
  Action: `git rm --cached .claude/settings.local.json && echo '.claude/settings.local.json' >> .gitignore`

### [~] Structural -- fix soon

Agent instructions in the wrong layer, missing hooks, oversized descriptions, verifier gaps.

**Agent-runtime instruction drift (Claude, Codex, Pi, etc.).** Use `AGENT CONFIG SUMMARY` first. Report a Structural finding when `AGENTS.md` and runtime-specific files both contain substantial guidance without delegation, when Codex `config.toml` lacks trust for the current project, when Pi settings or package metadata point at missing skill roots, when project agent instructions are missing, or when runtime-specific instructions contradict the shared project source of truth. Also report when important rules live only in ignored or private local instruction overlays but the tracked/public docs lack them; those overlays are private context, not durable project source of truth. Do not print raw config values. Secrets, tokens, keys, and passwords must appear only as `[REDACTED]`.

Quick check from the project root, reusing `$HEALTH_SCRIPT` resolved in Step 1:

```powershell
& "$POWERSHELL" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$HEALTH_LAUNCHER" agent-context . summary
```

On Linux and macOS:

```bash
BASH_ENV= ENV= /bin/bash -p "${HEALTH_SCRIPT%/*}/check-agent-context.sh" . summary
```

**AI-maintainability findings.** For the maintainability lane (verification surface, conversation-derived guidance, concentrated fix chains, risk-backed hotspot ownership, non-obvious constraint reachability, verifier wrapper, broken doc and Markdown references, stale verifier cache output), load `references/maintainability-findings.md` and work its checks with `AI MAINTAINABILITY SUMMARY` / `DETAIL`.

### [-] Incremental -- nice to have

Outdated items, global vs local placement, context hygiene, stale allowedTools entries.

---

If no issues: `All relevant checks passed. Nothing to fix.`

## Non-goals

- Never auto-apply fixes without confirmation.
- Never turn repository size, file length, contributor count, skill count, or missing descriptive inventory into a finding without behavioral evidence.
- Never act as a heavy lint, typecheck, duplication, or architecture-rewrite substitute; `/health` reports maintainability guardrails and concrete next actions only.

## Gotchas

| What happened                                                               | Rule                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missed the local override                                                   | Always read the runtime's local override file too (`settings.local.json` or equivalent); it shadows the committed file                                                                                                                                                                         |
| Subagent timeout reported as MCP failure                                    | MCP failures come from the live probe, not data collection                                                                                                                                                                                                                                     |
| Flagged intentionally noisy hook as broken                                  | Ask before calling a hook "broken"                                                                                                                                                                                                                                                             |
| Hook seemed not to fire, but it did -- a later UI element rendered above it | Hook firing order is not visual order. Before re-editing the hook config: (a) confirm with `--debug` or by piping output, (b) check whether a diff dialog, permission prompt, or other UI element rendered on top and pushed the hook output offscreen, (c) only then suspect the hook itself. |
| Treated missing specs/docs as a failure                                     | Decision artifacts are optional by default. Escalate missing docs/specs only when active handoff risk, failure evidence, or the user request makes them necessary.                                                                                                                             |
| Treated a large file or absent project map as a finding                     | These are discovery signals only. Require a demonstrated risk, unreachable non-obvious constraint, recurring failure, or verifier gap before reporting them.                                                                                                                                   |
| Treated an ignored AGENTS/CLAUDE file as durable project truth              | Report whether the rule is tracked and distributed. Local overlays can inform the audit, but durable fixes belong in public repo docs or shipped skill/rule files.                                                                                                                             |
| Treated a review scorecard as maintainability documentation                 | Scorecards are snapshots. Extract the invariant and verification path, then remove or archive the report instead of calling the score itself a durable rule.                                                                                                                                   |
