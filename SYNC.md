# Sync Info

Tracked upstreams for ongoing distillation. All are vendored as git submodules under `vendor/`; the SHAs below record what the current tree was distilled against.

## Consumer: plugins/dyc

The `plugins/dyc` plugin distills from two primary upstreams:

| Upstream                    | Role                       | Distillation scope                                                                                                                        |
| --------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **tw93/Waza**               | Core skills source         | 8 core skills (think, check, hunt, ui, read, write, learn, health) + forge references; agents, rules, and reference docs under each skill |
| **addyosmani/agent-skills** | Validator & lint reference | `validate-plugin.ts` gate design, `skill-lint.ts` checks, skill frontmatter validation patterns                                           |
| **mattpocock/skills**       | Distillation reference     | Skill authoring patterns and structure distilled in the 2026-08 mattpocock distillation pass                                              |

Other vendored upstreams (claude-plugins-official, openai/plugins, upstash/context7) serve as cross-vendor reference for forge's multi-vendor extensions architecture, not as direct dyc skill sources.

Sync workflow: `git submodule update --remote` → diff against recorded SHA → incremental distillation → update SHA + date here.

## Distillation Principles

Guidelines for deciding what flows from upstream into `plugins/dyc`:

1. **Scope-mapped content first.** Distill changes to files that have a direct counterpart in dyc (same skill, same path). If the upstream file has no dyc equivalent, skip unless it fills a gap dyc should have.
2. **Skill substance over packaging.** Always distill changes to `SKILL.md`, `references/`, and `rules/` within dyc's 8+3 skill set; upstream skill-level `agents/` briefs park in repo-root `agents/` instead（dyc 不以技能内嵌 agents/ 发布，见 `docs/agents.md`）. These are the core deliverables.
3. **Tooling improvements.** From agent-skills, distill validator gates, lint rules, and frontmatter validation patterns that improve forge's `validate-plugin.ts` or skill-lint checks.
4. **Skip vendor-local artifacts.** Do not distill upstream's own packaging files (`marketplace.json`, `plugins/waza/.codex-plugin/plugin.json`, setup scripts) — dyc manages its own extensions namespace independently.
5. **Skip chore commits.** Version bumps, release tags, CI tweaks, and formatting-only changes do not require distillation.
6. **Preserve intentional divergence.** If dyc has deliberately extended or modified a file beyond what upstream contains (e.g., forge skill, additional skills, structural audit fixes), merge upstream changes carefully — do not overwrite dyc-specific additions.
7. **New upstream files require judgment.** When upstream adds a file that dyc lacks, evaluate: does it belong to an existing dyc skill? Does it introduce a new capability dyc should adopt? If neither, defer and note it in the sync log.
8. **Record what was distilled and what was skipped.** Each sync updates the SHA, date, and a one-line change summary. Skipped items worth remembering get a brief note so future syncs can re-evaluate.

## addyosmani/agent-skills

- **Source:** `vendor/addyosmani/agent-skills`
- **Upstream:** https://github.com/addyosmani/agent-skills
- **Git SHA:** `be4e44a9fbc5e8df0beaefadbb28bd22ee61cc39`
- **Synced:** 2026-09-14
- **Changes since last sync:** 32+ commits — `context-engineering` gained Context Budget Management (trim at 75%, compress before dropping, recency ordering) and Restartable Session Boundaries; `reference/security-checklist.md` gained Destructive Path Operations (resolved symlinks, allowlisted root, minimum depth, ownership evidence, plus self-attestation and check/use-race limits); `observability-checklist.md` gained the multi-entry-point log field; security hardening gained the shared-store rate-limit rule; shipping gained the Error Budget Release Gate; spec-driven gained the external-spec-tool delegation rule
- **Distilled into dyc:** `health/references/context-engineering.md` (budget management + restartable boundaries + context-cliff anti-pattern), `think/references/spec-mode.md` (external spec tools), `check/references/security-checklist.md` (destructive path operations + shared-store rate limiting), `check/references/observability-checklist.md` (entry-point field + runbook shape), `check/references/shipping.md` (error budget gate)
- **Skipped this sync:** `scripts/run-evals.js` null-expectation guard (dyc has its own eval harness); `docs/*` vendor-local setup guides; per-skill frontmatter wording touches with no dyc counterpart

## mattpocock/skills

- **Source:** `vendor/mattpocock/skills`
- **Upstream:** https://github.com/mattpocock/skills
- **Git SHA:** `3cca18b368ae95cdbdebbff572ccafa662551015`
- **Synced:** 2026-09-14
- **Changes since last sync:** 2 commits — `scripts/link-skills.sh` stops linking `misc/` into local skill directories
- **Skipped this sync:** vendor-local scripting only, no distillation surface

## anthropics/claude-plugins-official

- **Source:** `vendor/anthropics/claude-plugins-official`
- **Upstream:** https://github.com/anthropics/claude-plugins-official
- **Git SHA:** `022b3c274938ddfb9fd928fc582eb9b9ed0f537f`
- **Synced:** 2026-09-14
- **Changes since last sync:** marketplace entry bumps only
- **Skipped this sync:** all — per principle 5, marketplace churn is not a distillation surface

## openai/plugins

- **Source:** `vendor/openai/plugins`
- **Upstream:** https://github.com/openai/plugins
- **Git SHA:** `1dc195897af4161d039b80d8471ec0a10c9bbc89`
- **Synced:** 2026-09-14
- **Changes since last sync:** 7 commits — curated marketplace additions (Qodo, CrowdStrike), plugin images, Codex Security sync
- **Skipped this sync:** all — marketplace registry churn only

## tw93/Waza

- **Source:** `vendor/tw93/Waza`
- **Upstream:** https://github.com/tw93/Waza
- **Git SHA:** `ba60df6efd4ff9a8332e939c6027f156440d2eb8`
- **Synced:** 2026-09-14
- **Changes since last sync:** 23 commits — think gained the Simplicity Gate and moved Evaluation/Triage Mode bodies into references; check gained "Question the Approach", the lockfile-verification rewrite, broader write authorization in Autofix Routing, and the verification-evidence rewrite; hunt retired the file-count approval boundary and corrected ime-unicode offset/ordering guidance; read moved to helper-directory + built-in-fetcher structure with a tightened third-party opt-in boundary; write hardened author-voice/emotion preservation, English core rules, long-form scope, product-localization coverage ledger, and identity redaction; health hardened secret-assignment regexes across four scripts, made the skill-description snapshot single-pass, softened MCP/verifier severity claims, and widened verifier discovery to npm defaults; ui reworked widow/text-wrap/breathing rules and viewport verification
- **Distilled into dyc:** the corresponding dyc files under `plugins/dyc/skills/` (think, check, hunt, read, write, health, ui, learn) and the repo-root `agents/health/inspector-{context,control}.md` briefs
- **Skipped this sync:** `dispatch_intent` frontmatter field (dyc routing metadata stays in `when_to_use`); Waza packaging/metadata codegen; `agent-skills`-style per-skill `agents/` embedding (dyc keeps briefs at repo root, see `docs/agents.md`)

## upstash/context7

- **Source:** `vendor/upstash/context7`
- **Upstream:** https://github.com/upstash/context7
- **Git SHA:** `6f42b66f3b6dee20ba870dd6f70f1b565eb62e6e`
- **Synced:** 2026-09-14
- **Changes since last sync:** 33 commits — product releases, SDK/MCP features, docs restructure
- **Skipped this sync:** all — vendor-local product repository, no distillation surface

## Updating

1. `git submodule update --remote vendor/<name>`
2. Diff the new upstream state against the SHA recorded here and decide what to distill.
3. Update the SHA and date above, and commit the submodule pointer together with this file.
