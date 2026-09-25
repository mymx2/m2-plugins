---
name: pm
description: 'Produces PM deliverables and decision frameworks: PRD, user stories, Epic breakdown, backlog prioritization (RICE, MoSCoW), feedback analysis, competitive comparison, metrics reviews (DAU, funnel, retention), roadmaps, GTM (pricing, channels, positioning). Use when users ask to write a PRD, split stories, rank a backlog, analyze feedback or competitors, review metrics, or plan GTM. Not for engineering planning (think), open research (learn), prose polishing (write), or code review (check).'
when_to_use: 'PRD, 需求文档, 用户故事, 验收标准, 需求排序, backlog, RICE, MoSCoW, 排期, 产品脑暴, 用户反馈, 差评分析, 竞品分析, 功能对比, 指标复盘, DAU, 留存分析, 转化漏斗, 北极星指标, 数据异常, 路线图, 迭代计划, 里程碑, 延期分析, 商业化, GTM, 定价策略, 渠道策略, PMF, 产品定位, user story, acceptance criteria, prioritize backlog, product brainstorm, feedback analysis, metrics review, pricing strategy'
---

# PM：产品交付物与决策框架

一份产品交付物的价值在于推动决策：做什么、按什么顺序、做完怎么算成。只是把需求复述进模板的文档没有价值。

## 概述

每份交付物的终点都是团队可以直接行动的东西：一张排序表、一份可评审的文档、一个归因结论、或一个明确判断。

## Outcome Contract

- Outcome: a PM deliverable the team can act on without another decision meeting.
- Done when: every claim carries a source or confidence tag, every ranking table names its framework and scores, and the deliverable passes its own quality gate.
- Evidence: user-supplied data (feedback, metrics, competitive materials, requirement lists); missing data explicitly flagged as assumptions.
- Output: deliverables in the format defined by the corresponding reference, with assumptions and confidence labels inline.
- Authorization: drafting and structuring only. Do not commit, push, or modify project code unless the current turn explicitly asks to.

## 何时使用

- 撰写或评审 PRD、功能规格、需求文档
- 把 Epic 拆成带验收标准的用户故事
- 给 backlog 或需求列表排序（"先做哪个"、"需求排序"）
- 围绕具体产品问题做脑暴
- 规模化分析用户反馈、评论、工单
- 面向产品决策的竞品分析（功能矩阵、差异化）
- 产品指标复盘（DAU、留存、漏斗、异常归因）
- 更新路线图或迭代状态
- 商业化策略：定价、渠道、PMF 验证、产品定位

## 模式选择

从用户点名的交付物推断模式，然后完整读入对应 reference。一次点名多个时按依赖顺序执行（反馈/竞品 → 脑暴 → 优先级 → PRD → 故事拆解）：每个模式产物是下一个模式的输入。

| 用户诉求                               | 加载                                       |
| -------------------------------------- | ------------------------------------------ |
| PRD、功能规格、需求文档                | `references/prd.md`                        |
| 用户故事、拆 Epic、验收标准            | `references/prd.md`（故事拆解节）          |
| 需求排序、backlog 排序、优先级         | `references/prioritization-frameworks.md`  |
| 产品脑暴、功能创意                     | `references/discovery.md`（脑暴节）        |
| 用户反馈、评论、工单分析               | `references/discovery.md`（反馈节）        |
| 竞品分析、功能对比、差异化             | `references/discovery.md`（竞品节）        |
| 指标复盘、DAU/留存/漏斗、数据异常      | `references/metrics-review.md`             |
| 路线图、迭代状态、里程碑、延期分析     | `references/metrics-review.md`（路线图节） |
| 商业化、GTM、定价、渠道、PMF、产品定位 | `references/gtm.md`                        |

## 流程

每个模式都走以下五步；框架细节在对应 reference 里。

1. **输入检查**：点名该交付物需要什么输入（需求列表、反馈数据、指标、竞品名）。必填输入缺失就追问；可选上下文缺失就声明假设继续，缺了就标 `[待补充]`。
2. **选框架分支**：PRD 按产品类型（B2C/B2B/内部工具/平台型），优先级按数据充分度，竞品按分析目的。说明选了哪个分支、为什么。
3. **跑框架**：先机械地套用 reference 的表格与决策规则，再发表评论。框架先行，判断在后。
4. **质量门**：用 reference 的自检清单逐项核对产出，不过就改到过。
5. **决策收尾**：以可执行的剩余决策结尾——先做什么、验证什么、砍掉什么——而不是复述写了什么。

## 来源与可信度纪律

所有模式都遵守：

- 每个关于用户、竞品、指标的事实性论断都带可信度标签：**高**（用户提供的数据或一手公开来源）、**中**（可信二手来源）、**低**（推断、厂商自述、过期信息，标 `[待核实]`）。
- 主要建立在低可信度论断上的交付物，开头就声明这一点，其结论读作待验证的假设，不是已定的决策。
- 区分用户告诉你的和你推断的。推断允许，不标注的推断不允许。

## 常见自我合理化

- "模板填满了就是交付物合格"——通篇复述需求和空泛目标的文档过不了任何质量门；价值在框架逼出来的决策里。
- "PRD 功能写得多显得思考深"——需求镀金是最常见的 PRD 失败；一期聚焦 3-5 个功能的 MVP 好过没人做得完的全量清单。
- "凭感觉排序比框架快"——无法被挑战的感觉排序每次开会都会被重吵；框架打分才是排序能立住的原因。
- "正面反馈不用分析"——好评告诉你该守住什么；只罗列吐槽的反馈报告丢了一半信号。

## 红线

- 在 PRD 里写技术实现（数据库、框架、架构选型）——PRD 只写做什么和为什么，不写怎么做
- 编造指标、用户数字、竞品事实，而不是标 `[待补充]` / `[待核实]`
- 排序时不点名框架和打分
- 所有需求都落在 Must-have / P0——没有做取舍的优先级表等于没排
- 验收标准写成 QA 无法执行的空话（"功能正常"），而不是带具体值的 Given-When-Then
- 指标复盘只报数字不给归因链（什么变了 → 哪个细分 → 为什么）

## 验证

通过对应 reference 的质量门。

## 陷阱

| 发生了什么                        | 规则                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------- |
| 用户只说"写个PRD"没给需求         | 先追问功能描述；只有一句话的诉求给骨架版 PRD 并标 `[待补充]`，不编造完整文档 |
| 需求列表太小（<3 条）排不出名堂   | 照排但标注样本过薄                                                           |
| 没有量化数据跑 RICE               | 降级到 ICE 或 MoSCoW，并说明因缺数据降级了框架                               |
| 反馈数据不足 20 条                | 切精读模式：小样本逐条解读，不做统计                                         |
| 用户说"竞品分析"实际在选库/选工具 | 那是技术选型研究，走 `learn`；pm 的竞品模式只管产品/市场竞争者               |
| 指标靠口述（"DAU 降了两万"）      | 可以分析口述，但每个数字标注为用户陈述，承重结论要到底表                     |
