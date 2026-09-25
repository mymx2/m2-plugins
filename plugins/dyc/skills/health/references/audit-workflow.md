# Audit Workflow

## Step 0: Establish the evidence basis

Do not grade a repository by file count, contributor count, skill count, the presence of a project map, or the length of its largest file. Record four evidence classes instead:

| Evidence                    | Question                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Risk**                    | Which paths can lose data, spend money, publish or deploy, cross trust boundaries, or create hard-to-reverse state?                 |
| **Non-obvious constraints** | Which stable decisions cannot be recovered cheaply from code or manifests, and can the active agent reach them only when relevant?  |
| **Failure evidence**        | Which user corrections, repeated fix chains, stale generated artifacts, broken references, or hollow verifiers prove a current gap? |
| **Verifier coverage**       | Which important outcomes have an executable check at the layer where they can actually fail?                                        |

## Evidence Ladder and Finding Qualification

Grade every configured capability on a four-rung ladder, and never award credit above the rung the evidence supports:

| Rung                  | Meaning                                                | Example                                                      |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Present**           | The asset exists on disk                               | hook configured, rule written, verifier script present       |
| **Wired**             | It is connected to the runtime that should trigger it  | hook registered in settings and actually loaded              |
| **Exercised**         | It ran on a real event in the observed window          | hook fired on an actual edit; verifier ran in CI             |
| **Outcome-supported** | Its output changed a decision or caught a real failure | verifier blocked a bad merge; hook prevented a secret commit |

A configured capability is not an exercised behavior. Presence is inventory; only the Exercised and Outcome-supported rungs justify claiming a guardrail works. A setup that is Present-only cannot earn a "healthy" verdict no matter how complete the inventory looks.

## Step 1: Collect data

Run the collection script in summary mode first. Do not interpret yet. Run the Health launcher in collect mode (Windows: `run-health.ps1`; POSIX: `collect-data.sh`) under `<skill-base-dir>/scripts/` — full invocation flags and ExecutionPolicy notes live with the scripts.

Every `.sh`, `.ps1`, and `.py` under `scripts/` is executed by the agent; none is read as reference material. Beyond the entry points named here, the launcher dispatches the `check_*.py` and `check-*.sh` helpers in the same directory per action for data collection; deep mode additionally runs `scan_skill_security.py`.

Sections may show `(unavailable)` when tools are missing:

- trusted `python3` missing → conversation, MCP/hooks/allowedTools, and skill-security sections unavailable
- `settings.local.json` absent → hooks/MCP may be unavailable (normal for global-only setups)

Treat `(unavailable)` as insufficient data, not a finding. Do not flag those areas.

Before analyzing, confirm `audit_root` in `PROJECT SIGNALS` is the intended project. The collector audits the current working directory and does not guard against the wrong root; a run in the wrong directory produces a plausible but misleading report.

The collector includes both runtime-specific and agent-agnostic surfaces:

- `AGENT CONFIG SUMMARY` / `AGENT CONFIG DETAIL` for Codex, Claude, Pi, and project instruction files.
- `AI MAINTAINABILITY SUMMARY` / `AI MAINTAINABILITY DETAIL` for project signals, verification surface, generated mirrors, wrappers, and doc links.

## Step 1b: MCP Live Check

Test every MCP server: call one harmless tool per server. Record `live=yes/no` with error detail. Respect the runtime's own disable mechanism (e.g. Claude's `enabled: false`; skip without flagging). For API keys, record only set/unset.

## Step 1c: Safety and security checks

These run after collection and before the Step 2 analysis. The first two apply to every audit; the third only to projects with long-running or autonomous agents.

### Security Baseline Checks

Run these on every audit. They are the floor, not the ceiling. Load `references/safety-baseline.md` and work its three checks: deny-list floor, permission-layer vs instruction-layer gating, and environment override surface.

For pipe-to-shell blocking, `scripts/block-pipe-to-shell.py` is a distributable PreToolUse hook template that refuses remote-download-to-shell pipelines; it is not part of the collection flow — reference it only when the user asks to actually install the protection.

### Memory and Skill Supply Chain

Treat agent memory and third-party skills as supply-chain artifacts. They run with the user's privileges.

**Memory hygiene.** Audit the project's long-term agent memory store for secrets, tokens, or credentials (Critical), and for entries written by untrusted runs (subagent invoked on attacker-controlled input, /loop iteration over external content); recommend rotation after such runs. For high-risk one-off runs (untrusted PDFs, uncontrolled scraping, third-party scripts), recommend disabling memory persistence for that session entirely.

**Skill supply chain.** Third-party skills, plugins, and MCP servers run with the user's privileges. For each one not authored in this repo, check: source pinned to a release tag or revision (not `main`, a branch, or a remote git marketplace left tracking its latest head), hook handlers do not write to credential directories, MCP servers have explicit user consent (not auto-trusted by wildcard). Report unpinned sources or unreviewed hook handlers as Structural, not Critical, unless an active exploit signal is present.

### Long-Running Agent Stop Conditions

For projects that use `/loop`, autonomous agents, or any long-running agent flow, load `references/long-running-agents.md` and audit the four hard stop signals it lists. Projects without such a flow skip this check.

## Step 2: Analyze

Analyze locally from the summary output by default. If the user asks for a deep/full/thorough audit, remembered preference requires it, the request explicitly targets AI maintainability, or local analysis cannot classify a material security/control ambiguity, re-run the launcher in `collect auto deep` mode (same script as Step 1, with the `auto deep` arguments). Then work the deep lanes: context + security; control + behavior; and, only for deep health audits or explicit code-rot/AI-maintainability requests, AI maintainability. Inspector agents are a vendor customization, not skill content; when the harness provides none, run the lanes sequentially in-session. Redact credentials to `[REDACTED]`.

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

Confirmed dangerous permissions, consequential rule violations, security findings, and leaked credentials.

Example:

- [!] `settings.local.json` committed to git (exposes MCP tokens) (Claude path; substitute the runtime's local-override file)
  Why: leaked token enables remote code execution via installed MCP servers
  Action: `git rm --cached .claude/settings.local.json && echo '.claude/settings.local.json' >> .gitignore`

### [~] Structural -- fix soon

Agent instructions in the wrong layer, missing hooks, oversized descriptions, verifier gaps.

**Agent-runtime instruction drift (Claude, Codex, Pi, etc.).** Use `AGENT CONFIG SUMMARY` first. The routing and layering rules for agent context live in `references/context-engineering.md`; apply them here. The one health-specific case: report a Structural finding when Codex `config.toml` lacks trust for the current project (verify against installed codex version; trust model has changed across releases). Do not print raw config values. Secrets, tokens, keys, and passwords must appear only as `[REDACTED]`.

Quick check from the project root: invoke the launcher as `agent-context . summary` (Windows: `run-health.ps1`; POSIX: `check-agent-context.sh` under `<skill-base-dir>/scripts/`).

**AI-maintainability findings.** For the maintainability lane (verification surface, conversation-derived guidance, concentrated fix chains, risk-backed hotspot ownership, non-obvious constraint reachability, verifier wrapper, broken doc and Markdown references, stale verifier cache output), load `references/maintainability-findings.md` and work its checks with `AI MAINTAINABILITY SUMMARY` / `DETAIL`.

### [-] Incremental -- nice to have

Outdated items, global vs local placement, context hygiene, stale allowedTools entries.

---

If no issues: `All relevant checks passed. Nothing to fix.`
