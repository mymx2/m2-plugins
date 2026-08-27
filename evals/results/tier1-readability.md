# Tier 1 — 弱模型可读性审查(think / check)

视角:一个不看示例、不做推理链、逐句照做的弱模型。问题分三级:

- **BLOCKER** 会导致错误行为(错路由、错流程)
- **STRUCT** 触发或流程缺陷(环境假设、内部矛盾)
- **INCR** 打磨项(术语未定义、措辞歧义)

行号已对 `plugins/dyc/skills/{think,check}/SKILL.md` 当前版本逐条核对。

---

## think/SKILL.md

| file:line | 问题                                                                                                                                                                                                         | 严重度      | 改写建议                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L9        | "Prefix your first line with 🥷 inline, not as its own paragraph." — "inline" 对 emoji 含义模糊,弱模型可能把 emoji 放独立段落、或干脆不放                                                                    | INCR        | "Put 🥷 at the very start of your first sentence (no blank line before it)."                                                                                         |
| L48       | "scan the project's AGENTS.md, CLAUDE.md, .claude/rules/*.md" — 环境假设:`.claude/rules/` 是 Claude 专属路径,Codex/Qoder 运行时不存在,弱模型会报"找不到"或跳过                                               | STRUCT      | "scan any project-level agent instruction files present (AGENTS.md, CLAUDE.md, .claude/rules/_, .codex/rules/_, .qoder/rules/*, or equivalent)"                      |
| L72       | "Upgrade to full mode if you find 3 or more genuinely different approaches" — "find" 主观,弱模型不知何时算"找到 3 个"                                                                                        | INCR        | "Upgrade when you can name 3 approaches that differ in at least one of: data model, failure mode, or dependency surface."                                            |
| L80       | "Inventory the durable entity delta before a Keep or Pivot verdict" — "durable entity delta" 是术语,本文件未定义(下文虽列了 settings/flags/...,但术语本身先出现)                                             | STRUCT      | "List every new or removed public surface (settings, flags, env vars, commands, services, tabs, routes, schemas, dependencies, public APIs, long-lived helpers)."    |
| L104      | Triage Mode 触发条件 "user forwards a bundle of asks ... '看看这几个需求'" — **description(L3)不含 triage/bundle/归类 词汇**,导致 Tier 2 语义路由把该 prompt 判给 check(含 "issue triage")。两层证据互相印证 | **BLOCKER** | 改 description(不动正文):cue 列表加 "or triaging a bundle of mixed requests/feedback into accept/reject buckets"                                                     |
| L185      | "When the user later says 'Implement the plan', '可以干', '直接改', '整', or equivalent" — "整" 高度口语化,"equivalent" 无边界,弱模型可能把任何后续消息当批准                                                | INCR        | "When the user sends an explicit go-ahead like 'implement this plan' / '可以干' / '直接改' / '整'(a short imperative that names the plan or uses those exact verbs)" |
| L233      | After Approval 的引导 block 说 "run `/check`" — 环境假设:`/check` 是 slash 命令,只在支持它的运行时存在;Qoder/Codex 里无此命令                                                                                | INCR        | "After approval, suggest: 'To implement, say implement this plan. After implementation, run the check skill to review before merging.'"                              |

---

## check/SKILL.md

| file:line | 问题                                                                                                                                                                                                                    | 严重度 | 改写建议                                                                                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L11       | "> Note: /review is a built-in Anthropic plugin command ... Do not re-trigger /review from within this skill." — 环境假设(Anthropic 运行时),Qoder 无 /review;且 "alias code-review" 在本文件未再出现,弱模型不知别名何来 | STRUCT | "This skill is named check. Some runtimes alias it as code-review. Do not invoke any other review command from inside this skill."                                                                                         |
| L98       | "**All local or uncommitted changes**: ... Being on the base branch does not make this scope ambiguous." — 双重否定("does not make ... ambiguous"),弱模型可能反向理解成"在 base 分支就模糊"                             | INCR   | "Even when the current branch is the base branch, the scope is still inferable from staged/unstaged/untracked state."                                                                                                      |
| L119      | "generated mirrors" — 术语未定义(下文 L168 "generated or bundled outputs" 才接近解释)                                                                                                                                   | INCR   | "generated mirrors (files auto-produced by a build step that mirror source, e.g. dist/, build/, generated/)"                                                                                                               |
| L169      | "a hollow green" — coined term,虽 inline 给了两个例子,但术语本身先出现,弱模型可能跳过例子                                                                                                                               | INCR   | "a hollow green (a pass that never actually exercised the real path — e.g. skipped optional-dep job still printing OK, early-return leaving output empty so a true-on-empty assertion passes)"                             |
| L174      | "whole-file reserialization" — 术语,括号解释在从句深处                                                                                                                                                                  | INCR   | "whole-file reserialization (the package manager rewriting the file with its own formatter, which can reorder keys or escape non-ASCII)"                                                                                   |
| L246      | "spawn one independent skeptic per finding" — 依赖 subagent 设施,弱模型可能不知自己是否有;后半句虽给 fallback,但"when the agent facility allows it"前提模糊                                                             | INCR   | "If the environment has a subagent facility, spawn one independent skeptic per finding. Without that facility, run the skeptic pass yourself in the same session: re-read the cited code this turn and confirm the claim." |
| L288      | "Open the final message with the status line as plain prose before any table or detail" 随后紧跟 fenced block — "plain prose" 与 "block" 并存,弱模型不知先写散文句还是先贴 block                                        | STRUCT | "Open the final message with one plain-prose sentence stating where the work stands (e.g. '已提交并推送为 abc1234'), then the status block below."                                                                         |

---

## 汇总

| 技能  | BLOCKER | STRUCT       | INCR                           |
| ----- | ------- | ------------ | ------------------------------ |
| think | 1(L104) | 2(L48, L80)  | 4(L9, L72, L185, L233)         |
| check | 0       | 2(L11, L288) | 5(L98, L119, L169, L174, L246) |

唯一 BLOCKER(think L104)与 Tier 2 语义路由的 FAIL 是同一缺陷的两面:description 缺 triage 词汇 → 路由被 check 抢走;正文 L104 的 Triage Mode 写得再完整,路由不到就永远触发不了。**修复只需改 description,正文不动。**

STRUCT 项集中在**环境假设**(Claude/Anthropic 专属路径与命令)——这对"多厂商适配"(forge 的卖点)是直接矛盾,优先级高于 INCR。
