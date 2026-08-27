# 蒸馏清单：mattpocock/skills → plugins/dyc

记录 `D:\37021\projects\demo\source_clones\skills`（Matt Pocock skills，37 技能）向 `plugins/dyc` 的蒸馏结果。**约束：不新增技能，dyc 保持 11 个**；全部增量并入现有技能的 `references/` 或正文。日期：2026-08-26。

蒸馏总原则：只取 dyc 缺失或有实质增量的纪律/方法/词汇；dyc 已覆盖或更成熟的一律跳过。所有产物过 forge 七门校验，触发词 Jaccard 维持 0（未新增技能，无撞车）。

## 新建的 reference（2 个）

| 文件                                  | 来源                                             | 增量                                                                                                           |
| ------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `think/references/domain-language.md` | domain-modeling + CONTEXT-FORMAT                 | 项目词汇表纪律（opinionated 选词、`_Avoid_`、只收特有概念、主动挑战术语）                                      |
| `think/references/deep-modules.md`    | codebase-design(SKILL+DEEPENING+DESIGN-IT-TWICE) | 深模块词汇体系（module/interface/depth/seam/adapter/leverage/locality、删除测试、依赖四分类、design-it-twice） |

## 并入现有 reference（按 dyc 技能）

### think

- `references/adr.md` ← domain-modeling/ADR-FORMAT：ADR 三条件门槛（hard-to-reverse + surprising + real trade-off）+ 七类 what-qualifies
- `references/interview.md` ← grilling + to-questionnaire：设计树-frontier-轮次访谈模型；"When the answer isn't in the room"（grill the send, not the subject）
- `references/idea-refine.md` ← prototype(LOGIC+UI)：throwaway 原型回答设计问题（单文件 HTML demo + `?variant=` 多变体）
- `references/spec-mode.md` ← to-spec + improve-codebase-architecture：先定测试 seam（existing 优先、理想一个）+ git-log 热点优先 + deletion test
- `references/task-breakdown.md` ← to-tickets + wayfinder：blocking edges/frontier、wide-refactor 的 expand–contract 例外、quiz 三问、snippet 例外、fog-of-war（not-yet-specified）
- `SKILL.md`：Reference Library 表挂载 domain-language 与 deep-modules 两行

### hunt

- `references/debugging.md` ← diagnosing-bugs：反馈环 10 种构造法 + tighten + red-capable 四判据 + 3-5 falsifiable 排序假设 + `[DEBUG-x]` 前缀 + redact 纪律 + "无正确 seam 即架构发现"

### check

- `references/test-checklist.md` ← tdd：Build-Time TDD Discipline 小节（seam 预先约定、red-green 循环规则、implementation-coupled/tautological/horizontal-slicing 三大反模式）
- `references/testing-patterns.md` ← tdd/mocking：为可 mock 而设计（DI 注入、SDK 风格接口优于通用 fetcher）
- `references/review-quality.md` ← code-review：Spec 轴（对照原 issue/spec 引原文，缺失/超纲/做错三分法，两轴不合并不重排，spec source 定位顺序）
- `references/mode-triage.md` ← triage + AGENT-BRIEF：Verify-the-claim 三态；Writing an Agent-Ready Brief（四原则 + 模板 + 反例）
- `references/git-workflow.md` ← resolving-merge-conflicts：逐 hunk 按 intent 解决冲突（追溯 primary source、保留双方意图、绝不 --abort、完成后跑检查）

### write

- `references/documentation.md` ← writing-for-agents + writing-*：prompt the positive（negation 反模式）、don't cache the environment、no-op 猎杀、ground-every-concept 纪律

### forge

- `references/skill-authoring.md` ← writing-for-agents + SKILL-MECHANICS：Writing for the Agent Reader 小节（context pointer、信息层级、completion criterion、leading words、negation）+ Skill Split 尾部 invocation 预算/router

### health

- `references/context-engineering.md` ← ask-matt/PHASE-BOUNDARIES + handoff + retro：Phase Boundaries 五选项决策树（Continue/clear/handoff/subagent/compact，compact 是默认非首选）+ primary/secondary 信息损耗 + handoff 写法 + retro 分工（standards 归 review 侧）

## 跳过（dyc 已覆盖 / 增量≈0 / 不符 dyc 形态）

| 源                                                                 | 理由                                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| research                                                           | learn 已覆盖且更深（一手来源、出处、矛盾可见）                                                                |
| to-spec/to-tickets 模板本体                                        | think 的 spec-mode/task-breakdown 已覆盖，增量（seam/expand-contract）已单独捕获                              |
| implement / implement-spec                                         | 编排链（tdd+code-review），实质已入 check/tdd；并发 subagent 编排不符 dyc 轻量形态                            |
| grill-me / grill-with-docs                                         | 薄壳（一句话调 grilling/domain-modeling），实质已保留                                                         |
| ask-matt                                                           | mattpocock 技能生态路由器，dyc 用 description 自动路由，无需手工 router                                       |
| setup-matt-pocock-skills                                           | issue tracker/标签/domain 配置向导，强绑 mattpocock 生态                                                      |
| triage 状态机主体 / OUT-OF-SCOPE                                   | check/mode-triage 已覆盖处置流；`.out-of-scope/` 知识库机制重、弱匹配                                         |
| wayfinder tracker 机制                                             | 重型 issue-tracker 编排，不符 dyc 单会话形态；fog-of-war 思想内核已入 task-breakdown                          |
| diagnosing-bugs/hitl-loop.template.sh                              | HITL step/capture 要义已并入 debugging.md 反馈环第 10 法，脚本不拷                                            |
| code-review Fowler smell 基线                                      | check/review-patterns 已有等价具体清单，逐条并入会稀释                                                        |
| teach                                                              | 跨 session 教学工作区（MISSION/lessons HTML），与 learn 的"产出参考"形态冲突；retention 设计超出 learn 边界   |
| handoff / claude-handoff                                           | think 已有 Implementation Handoff；handoff 写法已入 health；claude-handoff 绑 `claude --bg`                   |
| writing-beats / writing-shape / writing-fragments                  | "从零写长文"超出 write 的"编辑/润色"边界；grounding 精华已入 write/documentation.md                           |
| retro 七类框架                                                     | 与 health 审计框架重叠；"standards 归 review 侧"已入 health                                                   |
| wayfinder/wizard template.sh                                       | wizard 的 bash 向导库绑 mattpocock 流程，未单独蒸馏                                                           |
| misc/setup-pre-commit                                              | husky+lint-staged 配方，模型常识，搭建职责不在 dyc                                                            |
| misc/git-guardrails-claude-code                                    | health 的 Deny-list floor + Permission-layer gating 已更深覆盖危险 git 命令的 hook 层拦截                     |
| misc/migrate-to-shoehorn                                           | 绑 Matt 个人 npm 包 shoehorn                                                                                  |
| misc/scaffold-exercises                                            | 绑 Matt 私有 ai-hero-cli                                                                                      |
| in-progress/loop-me                                                | 个人生活自动化 loop；push-right 与 think/interview 的"facts are your job"重叠                                 |
| in-progress/setup-ts-deep-modules                                  | dependency-cruiser 强制深模块边界；理念已入 deep-modules.md，具体 config 模板未搬（dyc 无强制 lint 编排形态） |
| docs/、.agents/、scripts/、README/CLAUDE/CHANGELOG/.claude-plugin/ | 源仓库包装层，dyc 有自己的厂商适配与文档体系                                                                  |

## 验证

- 全部 11 技能 forge 七门：PASS
- 触发词两两 Jaccard：worst 0.000（< 0.5 阈值）
- `python scripts/validate_repo.py .`：通过
- `ruff check scripts/ plugins/`：通过
- `vp test`（93 tests / 6 files）：全部通过
