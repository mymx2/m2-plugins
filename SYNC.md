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
2. **Skill substance over packaging.** Always distill changes to `SKILL.md`, `references/`, `agents/`, and `rules/` within dyc's 8+3 skill set. These are the core deliverables.
3. **Tooling improvements.** From agent-skills, distill validator gates, lint rules, and frontmatter validation patterns that improve forge's `validate-plugin.ts` or skill-lint checks.
4. **Skip vendor-local artifacts.** Do not distill upstream's own packaging files (`marketplace.json`, `plugins/waza/.codex-plugin/plugin.json`, setup scripts) — dyc manages its own extensions namespace independently.
5. **Skip chore commits.** Version bumps, release tags, CI tweaks, and formatting-only changes do not require distillation.
6. **Preserve intentional divergence.** If dyc has deliberately extended or modified a file beyond what upstream contains (e.g., forge skill, additional skills, structural audit fixes), merge upstream changes carefully — do not overwrite dyc-specific additions.
7. **New upstream files require judgment.** When upstream adds a file that dyc lacks, evaluate: does it belong to an existing dyc skill? Does it introduce a new capability dyc should adopt? If neither, defer and note it in the sync log.
8. **Record what was distilled and what was skipped.** Each sync updates the SHA, date, and a one-line change summary. Skipped items worth remembering get a brief note so future syncs can re-evaluate.

## addyosmani/agent-skills

- **Source:** `vendor/addyosmani/agent-skills`
- **Upstream:** https://github.com/addyosmani/agent-skills
- **Git SHA:** `5a5ea45e806f82273549fd85e60adb95d55f510d`
- **Synced:** 2026-08-24
- **Changes since last sync:** 2 commits — fix(validator) allowlisted skills only; fix(skill-lint) frontmatter and exempt lookup

## mattpocock/skills

- **Source:** `vendor/mattpocock/skills`
- **Upstream:** https://github.com/mattpocock/skills
- **Git SHA:** `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`
- **Synced:** 2026-08-26

## anthropics/claude-plugins-official

- **Source:** `vendor/anthropics/claude-plugins-official`
- **Upstream:** https://github.com/anthropics/claude-plugins-official
- **Git SHA:** `340e33aef211d95769d252324854497af871dafe`
- **Synced:** 2026-08-24

## openai/plugins

- **Source:** `vendor/openai/plugins`
- **Upstream:** https://github.com/openai/plugins
- **Git SHA:** `11c74d6ba24d3a6d48f54a194cd00ef3beea18f9`
- **Synced:** 2026-08-24

## tw93/Waza

- **Source:** `vendor/tw93/Waza`
- **Upstream:** https://github.com/tw93/Waza
- **Git SHA:** `831d9b96d80165e8a0211314055da21452edda56`
- **Synced:** 2026-08-25
- **Changes since last sync:** 2 commits — fix(check) tighten delivery receipts (mode-ship account identity verification, mode-triage queue freeze + reconciliation); write skill pitfall table + write-zh rules 26-27

## upstash/context7

- **Source:** `vendor/upstash/context7`
- **Upstream:** https://github.com/upstash/context7
- **Git SHA:** `63a40c6a6a95ba7b4bf8823e6d817454a84be572`
- **Synced:** 2026-08-24

## Updating

1. `git submodule update --remote vendor/<name>`
2. Diff the new upstream state against the SHA recorded here and decide what to distill.
3. Update the SHA and date above, and commit the submodule pointer together with this file.
