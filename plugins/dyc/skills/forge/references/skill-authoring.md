# Skill Authoring

A skill is a workflow contract, not a knowledge dump. If you cannot define the outcome, evidence, and authorization boundary before writing step one, you are documenting a vague intention, not authoring a skill.

## Outcome Contract

- **Outcome**: A valid, portable, and trigger-ready `SKILL.md` file that passes all quality gates.
- **Done when**: The file exists at `skills/<name>/SKILL.md`, frontmatter validates against length/trigger/exclusion rules, no cross-skill file references exist, and no portability red lines are violated.
- **Evidence**: File content inspection; frontmatter character count; grep for forbidden patterns (`skills/*/SKILL.md`, `/Users/`, bare `bash` repo-relative invocations).
- **Output**: A single `SKILL.md` file plus optional `scripts/` or `references/` directories only when justified.
- **Authorization**: Drafting and structuring only. Do not execute scripts, install dependencies, or modify project code unless the current turn explicitly asks to test the new skill.

## Mode Picker

| Ask                                        | Mode                                          |
| ------------------------------------------ | --------------------------------------------- |
| Create a brand-new skill from scratch      | [Greenfield Authoring](#greenfield-authoring) |
| Fix validation errors in an existing draft | [Remediation](#remediation)                   |
| Add modes, phases, or supporting files     | [Expansion](#expansion)                       |

## Greenfield Authoring

Activate when the user requests a new skill and no `SKILL.md` exists yet.

1. **Elicit the contract first.** Before writing any markdown, confirm: What is the outcome? What counts as done? What is the evidence? What is off-limits? If the user cannot answer these, facilitate clarification; do not guess.
2. **Draft frontmatter.** Write `name` (kebab-case, must match intended directory), `description` (40-500 chars, must include a trigger cue ("Use when..." or the Chinese equivalent) and an exclusion cue ("Not for" or the Chinese equivalents); the Evidence Ladder lists the exact cue forms), and `when_to_use`. The description injects into the system prompt; the vendor hard cap is 1,024 chars but the validator gate is 500, so draft to the gate, not the cap. Validate length and cues immediately.
3. **Write the stance sentence.** One memorable line after the title that encodes the hardest lesson. If you cannot write it, the skill lacks a point of view; return to step 1.
4. **Structure the body.** Recommended sections in house-style order: Overview → Outcome Contract → When to Use → Process (numbered steps) → Common Rationalizations → Red Flags → Verification → Hard Rules → Gotchas → Output. The structural gate enforces only three things: `## Outcome Contract` present, at least one section with numbered steps, no orphaned headings. The rest are conventions, not validator-enforced; there is no exemption mechanism, so do not invent one.
5. **Isolation check.** Grep the draft for `skills/*/SKILL.md`. Replace any file-path references with skill-name-only references.
6. **Portability check.** Grep for personal paths, bare repo-relative invocations, AI attribution strings, private context markers, and root-level placement. Fix all violations before delivering.
7. **Supporting file gate.** Only create `scripts/` or `references/` if the main file exceeds ~300 lines or requires runnable helpers. Never create empty directories.

**Output format:**

- Deliver the complete `SKILL.md` in a fenced code block.
- List any supporting files created with their purpose.
- State which quality gates were validated.

## Remediation

Activate when an existing `SKILL.md` fails validation or the user reports a specific defect.

1. Identify the exact violation (e.g., `DESCRIPTION TOO SHORT`, `CROSS-SKILL FILE REFERENCE`, `MISSING EXCLUSION CUE`).
2. Apply the minimal fix. Do not restructure unrelated sections.
3. Re-validate the fixed field against its rule.
4. Report what changed and why.

**Output format:**

- `[FIXED] <rule-name>: <what was wrong> → <what was changed>`
- If unfixable without user input: `[BLOCKED] <rule-name>: <information needed>`

## Expansion

Activate when adding modes, phases, or supporting files to a working skill.

1. Confirm the addition does not create trigger overlap with existing modes.
2. Ensure new modes have disjoint activation conditions.
3. If adding supporting files, verify the main `SKILL.md` stays under 500 lines after linking.
4. Update the Mode Picker table if applicable.

## Skill Split 策略

一个插件应该包含多少个 skill？默认答案是**一个**，除非有明确理由拆分。

**单 skill 条件**（不拆分）：

- 插件有一个主要的用户任务，即使它也包含脚本、references、hooks、rules、agents、commands 或 MCP。
- 这些支撑组件服务于同一个工作流。
- 拆分只会让用户在实现细节之间选择，而不是在意图之间选择。

**多 skill 条件**（应拆分）：

- 插件暴露多个**独立工作流**，有不同的触发条件、输入、输出或安全约束。
- 不同用户角色会调用不同的能力。
- 某个 skill 是内部参考/助手，只应被其他 skill 调用。
- 来源已包含多个独立的 `SKILL.md` 文件。

**不应因支撑组件拆分**：agents、rules、hooks、commands、MCP 是支撑组件，不是拆分 skill 的理由。一个 skill 可以引用多个支撑组件。

**多 source skill 时的策略**：当本地目录包含多个 SKILL.md 时，列出候选并让用户选择，除非用户明确要求打包整个插件。不合并无关技能到一个大文件。

**Invocation 预算是拆分的隐藏成本**：model-invoked 技能付常驻 context load（description 始终在系统提示里）换取可发现性与其他技能可达；user-invoked 技能零 load 但只有人能触发，没有任何技能能调到它。只有当模型需要自主触达、或另一个技能需要调它时，才值得付常驻 load 拆成 model-invoked。当 user-invoked 技能多到用户记不住时，一个只负责"点名 + 何时用哪个"的 router 技能能把认知负荷压回单个入口——本插件全部技能为 model-invoked，router 由 description 路由承担，无需单独 router 技能。

## Hard Rules

- **Frontmatter is non-negotiable.** Name must match the kebab-case directory name. Description must be 40-500 characters (the validator gate; the 1,024-char vendor cap is not the draft target) with both "Use when..." trigger and exclusion cues. No exceptions.
- **No cross-skill file references.** Reference siblings by name only. Never by path.
- **No portability leaks.** No personal paths, bare invocations, AI attribution, or private context in shipped files.
- **No classifier-sensitive literals.** Describe adversarial behavior semantically; never embed prompt-injection phrases verbatim.
- **Supporting files require justification.** No empty directories. A reference file earns its place by being routed from `SKILL.md` and loaded on demand, not by hitting a size threshold.
- **Scripts stay self-contained.** Never import from outside the skill directory; an installed copy must run them as-is. Third-party packages must be optional: import behind a guard, use the package when the local environment has it, and degrade cleanly (fallback path or an explicit not-available message) when it does not.

## Instruction Calibration

Match instruction specificity to task fragility:

| Fragility                                   | Examples                               | Specificity                        |
| ------------------------------------------- | -------------------------------------- | ---------------------------------- |
| High freedom (judgment tasks)               | review criteria, tone guidance         | textual principles                 |
| Medium (repeatable shape, variable content) | report generation, commit messages     | pseudocode or templates            |
| Low (fragile, exactness matters)            | migrations, API calls, destructive ops | concrete scripts, no improvisation |

Content rules:

- **References one level deep.** `SKILL.md` may point to `references/`, but a reference file should not point deeper; nested reference chains cause partial reads and dropped context.
- **Fold time-sensitive content.** Never write "before 2025-08 use the old API" in the main flow. Put legacy or deprecated variants in a `<details><summary>Legacy...</summary></details>` block; the body describes only the current method.
- **Default + escape hatch, not option lists.** Do not enumerate equivalent libraries ("pypdf or pdfplumber or PyMuPDF"). Name one default and one exception branch: "use pdfplumber; for scanned PDFs use pdf2image + pytesseract". Option lists paralyze selection; a default plus a named exception preserves it.
- **Label every script execute vs read.** Each bundled script must state whether the agent runs it or reads it as reference material; unlabeled scripts get improvised treatment.
- **Feedback loop for quality-critical steps.** Edit → verify immediately → fix and re-verify on failure → proceed only on pass. Write the verification command into the skill, not just the intention to verify.
- **Description stays third-person.** The description injects into the system prompt; first- or second-person phrasing breaks register consistency.
- **Agent and persona prose avoids explicit tool names.** In `agents/*.md` and other system-prompt-style files, describe actions naturally ("read the file contents") instead of naming tools ("use the Read tool"); a tool rename must not invalidate the prompt. Tool permission boundaries belong in machine-readable config, not in prose.
- **Relay formatted tool output verbatim.** When a bundled script emits a formatted report (Markdown table, analysis output), the agent must pass it through unchanged: no summarizing, no rewording, no reformatting, no added titles or commentary; in log/data analysis almost any "summary" is information loss. Write the prohibition explicitly in the skill ("FORBIDDEN: do not summarize or reformat stdout; CORRECT: output stdout unchanged"), not as a soft preference.
- **Context budget test for every sentence.** Before adding a line to a `SKILL.md`, ask: "Would deleting this sentence cause the agent to make a mistake?" If not, do not add it. Common knowledge the model already has is not worth the attention it costs.
- **Author with the strongest model, verify on the weakest.** Skill authoring is a high-complexity task: write and iterate with the strongest model available (feed it best practices, real failure cases, and the current draft), then test the finished skill on the weakest model it must run on; instructions that only a strong model can follow are a defect.
- **Hand over the full debug snapshot.** When a bundled script fails during skill development, give the agent the error stack, the relevant source, and the exact input that triggered the failure, never just the error message. The triad lets the agent replay and converge; a bare `ErrorMessage` leaves it guessing.
- **Skill is advisory, hook is deterministic.** A skill makes violations rare; a hook or validator makes them near-impossible. Policy that must unconditionally hold needs the deterministic layer, with the skill as its human-readable explanation; never ship a must-always-hold rule as prose alone. Corollary: no human-approval prompts inside build-phase hooks; an approval prompt puts the human back on the critical path of every parallel session. Approval gates belong at the deploy/handoff boundary.

## Writing for the Agent Reader

A skill is read by a model under a token budget, not by a person browsing. These levers decide whether the agent reliably reaches and follows it.

- **The description is a context pointer.** Its wording, not its target, decides when the agent reaches the skill. Front-load the leading word; carry one trigger per branch (synonyms that rename one branch are one branch written twice — collapse them); cut identity the body already carries. A must-have skill behind a weakly worded description is a variance bug: sharpen the wording first.
- **Respect the information hierarchy.** Inline what every branch needs; push behind a `references/` pointer what only some branches reach. Steps the agent performs stay in-file; flat reference consulted on demand can sit in-file as peers; material only some paths need goes to a reference file. Push too little down and the top bloats; too much and you hide what the agent needs.
- **End every step on a completion criterion.** Make it checkable and exhaustive ("every modified model accounted for," not "produce a change list"). A vague bound invites premature completion — the agent rushes to _be done_. Sharpen the bound first; only if it is irreducibly fuzzy and you observe the rush, hide the later steps across a real context boundary (a handoff or subagent dispatch).
- **Use leading words.** A compact concept already in the model's priors (_tight loop_, _red_, _tracer bullet_) anchors a whole region of behavior in one token. Coining your own costs definition tokens a pretrained word gives free; reach for an existing word first.
- **Prompt the positive, not the negation.** "Don't X" drags X into context; state the target behavior instead. Reserve prohibition for hard guardrails that can't be phrased positively, and pair it with the positive target.

## Rationalization Smells

- "The description is obvious from the name": agents discover skills by description, not directory browsing; write it for the router.
- "I'll add the exclusion cue later": without it, the skill fires on adjacent tasks and wastes context; write it now.
- "This skill is simple enough to skip the Outcome Contract": if you cannot state the outcome in one sentence, the simplicity is illusory.
- "The supporting file is almost short enough to inline": if it is over 50 lines and self-contained, extract it; context is paid per load.
- "I referenced the other skill by path so the agent finds it faster": path references break installed copies; name references are resolved by the runtime.

## Gotchas

| What happened                                                                                         | Rule                                                           |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Description was 38 characters; parser rejected the skill                                              | Enforce 40-char minimum at draft time, not at validation time  |
| Agent followed another skill because trigger keywords overlapped 60%                                  | Audit `when_to_use` sets across sibling skills before shipping |
| Supporting file referenced via relative path; broke in installed copy                                 | Use name-only references or base-dir resolution mechanisms     |
| Stance sentence was generic ("be careful"); agents ignored it                                         | Stance must encode a specific, counterintuitive lesson         |
| Added `scripts/` directory with no scripts; CI flagged noise                                          | Create directories only when they contain files                |
| Script imported a rule library outside the skill directory; installed copy died on the missing import | Skill scripts import only within the skill directory           |

## Evidence Ladder

Every gate is automated by `scripts/validate-skill.ts` (inside the forge skill directory). Run `node <forge-skill-dir>/scripts/validate-skill.ts <skill-dir>`. Node >= 23 runs it directly via type stripping; otherwise use `tsx`. It exits non-zero and reports every failed gate. Trigger distinctness only runs when the skill sits inside a `skills/` tree.

1. **Frontmatter parse**: Valid YAML, name matches directory, directory name is kebab-case, description 40-500 chars with both a trigger cue and an exclusion cue. English cue pair: "Use when..." and "Not for"; Chinese cue pair: 「当…时」与「不适用 / 不适合 / 不用于」。
2. **Isolation grep**: Zero matches for `skills/*/SKILL.md` in file content.
3. **Portability grep**: Zero matches for personal paths, bare repo-relative invocations, non-portable surface markers (private context, hardcoded default save paths), and AI attribution strings.
4. **Content red lines**: Zero classifier-sensitive instruction literals in Markdown prose.
5. **Reference integrity**: Every `references/`, `agents/`, or `scripts/` path mentioned in SKILL.md prose resolves to a real file inside the skill directory.
6. **Trigger distinctness**: `when_to_use` keywords share Jaccard < 0.5 with any sibling skill (skipped when the skill is not inside a `skills/` tree).
7. **Structural completeness**: `## Outcome Contract` present, at least one level-2 section with numbered steps, no orphaned headings.

## Output

**Delivered skill summary:**

- **Skill**: `<name>` at `skills/<name>/SKILL.md`
- **Description**: `<first 80 chars>...`
- **Gates passed**: [list of validated rules]
- **Supporting files**: [list or "none"]
- **Known limitations**: [any accepted trade-offs or deferred items]

## Non-goals

- Never execute, test, or debug the skill being authored unless explicitly requested.
- Never auto-generate skills from vague prompts without eliciting the Outcome Contract first.
- Never include workflow steps in the description field.
- Never create placeholder supporting files to satisfy a perceived structural requirement.

## Boundary

This guide produces and validates skill definitions. Diagnosing runtime failures of deployed skills ("why isn't my skill triggering") is debugging, not authoring. Route it to the `hunt` skill.
