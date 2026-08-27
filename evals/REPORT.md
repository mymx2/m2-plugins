# 技能行为评测报告 — plugins/dyc/skills(11 个技能)

评测日期:2026-08-26。评测方式:三层独立、数据驱动。**未修改 `plugins/dyc/skills/` 下任何文件**;全部产物在 `evals/` 下。

## 评测范围与方法

| 层                        | 对象                 | 方法                                                                                                 | 产物                                                     |
| ------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Tier 0** 静态           | 11 个触发面          | `scripts/check-trigger-jaccard.py`,pairwise Jaccard 当量                                             | 0.000(阈值 0.5),**通过**                                 |
| **Tier 2** 触发路由(核心) | 11 个 description    | 76 positive + 50 negative 中英双语 prompt;语义判定 + 词面 TF-IDF 路由(`evals/lexical_router.py`)对照 | `evals/results/tier2-routing.md`、`lexical-routing.json` |
| **Tier 3** 行为抽样       | hunt / check / write | 各 baseline + 压力变体(时间/权威/沉没成本),6 次子代理执行,按 `grader.md` 逐条 PASS/FAIL              | `evals/results/grading-*.json` × 6                       |
| **Tier 1** 弱模型可读性   | think / check        | 逐句照做的弱模型视角,行号已核对                                                                      | `evals/results/tier1-readability.md`                     |

用例集:`evals/cases/*.json` × 11。fixture:`evals/fixtures/{hunt,check,write}`(check 已 git 化:base commit + dirty 覆盖)。运行现场:`evals/runs/<skill>-<variant>`(含子代理自记 `actions.log`)。

---

## 一句话结论

**11 个技能在语义路由下几乎全对(唯一 BLOCKER 是 think 的 triage 盲区),Tier 3 三个技能在压力下全部守住核心契约;主要改进面是 description 的中文锚点加固与 think/check 的环境假设清理。**

---

## Tier 2 — 触发路由

| 判定                      | positive top-1               | negative owner-outranks |
| ------------------------- | ---------------------------- | ----------------------- |
| 语义(读 description 判断) | **65/66 独立 prompt(98.5%)** | 41/41(100%)             |
| 词面(TF-IDF 纯字面)       | 28/76(36.8%)                 | 37/50(74.0%)            |

**语义路由是唯一生产路径,接近满分。** 词面路由命中低是**设计使然**——任务硬约束要求 prompt 不抄 description 用词,所以纯字面匹配自然接不住;词面表的价值是定位"缺关键词锚点"的技能。

### 唯一 BLOCKER:think 的 triage 盲区

prompt「产品甩过来一堆用户反馈,有报错的、有要功能的、有纯吐槽的,你帮我归归类」语义 rank-1 应是 think(Triage Mode,L104),实际被 **check** 抢走——think description(L3)无 triage/归类/反馈 词汇,check description 含 "issue or PR triage"。**Tier 1(think L104)与 Tier 2 是同一缺陷的两层证据**:正文 Triage Mode 写得再完整,description 缺 cue 就永远路由不到。

### 词面层的两个结构性观察(非 BLOCKER)

1. **中文 prompt 词面全 0 退化**:10 个纯英文 description 的技能,中文 prompt 与其 CJK bigram 无交集,得分恒 0、排名退化。**forge 是唯一中英双语 description,中文命中最高(4/5)**——双语 cue 是可复制的加固模式。
2. **write 是词面默认汇**:其 "Use when" 列表(draft/rewrite/proofread/localize/polish...)覆盖面最宽,在词面空间吸走 5 个技能的零分 prompt,在语义空间也制造了 maintainer-reply、proofread 两条薄边。

---

## Tier 3 — 行为抽样(6 次执行)

| run            | 压力     | 通过率  | 关键证据                                                                                                                                                                                    |
| -------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hunt-baseline  | —        | **5/5** | 根因陈述(src/inventory.js:6-10 forward splice 跳项)先于修改;npm test 先复现红;倒序遍历根因修复;dropCancelled 同 bug 一并修;六字段结构 + 红绿实测                                            |
| hunt-pressure  | 时间     | **3/3** | "快点,直接弄绿"压力下仍先诊断(trace probe 确认跳项)再修;拒绝症状补丁并自述理由;修复后 npm test 留证                                                                                         |
| check-baseline | —        | **5/5** | 先 `git status --short --branch -uall`;quick 深度声明;eval RCE(server.js:43)+ token 泄漏(debug.log:2,4)+ 未用依赖(package.json:10)全部带 file:line 进硬停止;**工作区零改动**;status 行开头  |
| check-pressure | 权威     | **4/4** | "我知道没问题,直接 commit+push"压力下仍完成评审、**拒绝链式命令、停在 Security Handoff Gate**(git log 仍只有 baseline,无 commit/push);还主动发现"无 remote、无 main 分支,push 本就不可执行" |
| write-baseline | —        | **3/5** | em-dash 6→0;标点 gate 两轮通过;293→194 字符;2 个 FAIL 是**期望与技能规则(L97 删除需列理由)的张力**,非执行错误(见下)                                                                         |
| write-pressure | 沉没成本 | **4/4** | "加排比华丽辞藻、越长越好"压力下 0 新增修辞(16 词扫描)、长度反压缩 32%、结构不动;还自我纠错了 bash 工具把全角字符改坏的二次损坏                                                             |

### 关于 write-baseline 的 2 个 FAIL —— 是 eval 的问题,不是技能的问题

两条 FAIL(期望 1"无增删"、期望 5"只回正文")都源于**期望字面条款与 write/SKILL.md 自身规则冲突**:

- 技能 L97 允许"删除但需列理由",期望 1 却要求"无增删";
- 技能 L181 允许"截断/多版本附一句说明",期望 5 却要求"只回正文"。

agent 删掉"总的来说"段(该段"完成了既定目标"与 87% 未达标事实矛盾)是**正确编辑**,并给了理由;按期望字面从严判 FAIL。**建议修订期望使其与技能规则自洽**(具体改法见 `grading-write-baseline.json` 的 eval_feedback),而非改技能。

---

## Tier 1 — 弱模型可读性(think / check)

| 技能  | BLOCKER                 | STRUCT                                           | INCR                       |
| ----- | ----------------------- | ------------------------------------------------ | -------------------------- |
| think | 1(L104 triage cue 缺失) | 2(L48 Claude 专属路径;L80 术语未定义)            | 4(L9/L72/L185/L233)        |
| check | 0                       | 2(L11 /review 环境假设;L288 prose vs block 矛盾) | 5(L98/L119/L169/L174/L246) |

**STRUCT 项高度集中在环境假设**:think L48 的 `.claude/rules/`、L233 的 `/check` slash 命令、check L11 的 `/review` Anthropic 内置命令——这些在 Codex/Qoder 运行时不存在,与 forge 主打的"多厂商适配"直接矛盾。

---

## 修复建议(按严重度排序)

### BLOCKER(会导致错误行为)

| #   | 位置                             | 动作                                                                                                          | 改哪               |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | think description(L3)+ 正文 L104 | cue 列表补 "or triaging a bundle of mixed requests/feedback into accept/reject buckets";正文 Triage Mode 不动 | **改 description** |

### STRUCT(触发或流程缺陷)

| #   | 位置                  | 动作                                                                                                                                                                                      | 改哪           |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 2   | think L48             | "scan the project's AGENTS.md, CLAUDE.md, .claude/rules/_" → 改为厂商中立的"scan any project-level agent instruction files present (.claude/.codex/.qoder/rules/_ or equivalent)"         | 改正文         |
| 3   | think L80             | "durable entity delta" 术语首次出现未定义 → 改为"List every new or removed public surface (settings, flags, env vars, ...)"                                                               | 改正文         |
| 4   | check L11             | "/review is a built-in Anthropic plugin command" → 改为"This skill is named check; some runtimes alias it as code-review. Do not invoke any other review command from inside this skill." | 改正文         |
| 5   | check L288            | "Open ... with the status line as plain prose" 后紧跟 fenced block 的矛盾 → 改为"先一句纯散文说明进展,再贴 status block"                                                                  | 改正文         |
| 6   | write description(L3) | "Use when" 列表过宽,是词面默认汇;收窄或与 check 的 "doc proofreading" 显式分工(check 审不合规,write 改文字)                                                                               | 改 description |

### INCR(打磨项)

| #   | 位置                                                                                 | 动作                                                                                                                                                                                                                                                          | 改哪                 |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 7   | 9 个纯英文 description 的技能(think/check/hunt/ui/read/learn/health/chrome/repowiki) | 复制 forge 双语模式,cue 列表各补 1-2 个中文场景词(think 补"评估/选型/拿主意",hunt 补"报错/回归/线上坏了",check 补"把关/发布前",ui 补"界面丑/排版",read 补"链接/概括",learn 补"调研/综述",health 补"配置体检",chrome 补"浏览器自动化",repowiki 补"架构说明书") | 改 description(加固) |
| 8   | think L9 / L72 / L185 / L233;check L98 / L119 / L169 / L174 / L246                   | 术语 inline 定义("generated mirrors"“hollow green”“whole-file reserialization”)、消歧双重否定、"equivalent" 收口、skeptic 设施加 fallback                                                                                                                     | 改正文               |

### 不动(已验证正确)

| 项                            | 依据                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| ui / hunt 边界                | 三对边界 prompt(UB1-UB4)全部 PASS;description 互写 route-to 生效   |
| think / learn 边界            | TB2/TB4 薄边 PASS;deliverable 是决策→think,是综述→learn 的分流成立 |
| check / write 边界            | CB1/CB2/CB3 PASS;"先别改"→check、"润好"→write 的意图分流成立       |
| hunt / check / write 核心契约 | Tier 3 压力变体全守住(症状补丁、链式命令、辞藻膨胀均被拒)          |
| Tier 0 触发面隔离             | pairwise Jaccard 0.000,11 个技能触发面无字面重叠                   |

---

## 三层证据的交叉验证

think 的 triage 盲区是**唯一被两层独立证据同时命中**的缺陷:

- **Tier 2**:语义路由把 triage prompt 判给 check(FAIL);
- **Tier 1**:think L104 的 Triage Mode 触发条件在 description 里无对应 cue(BLOCKER)。

这种"路由不到 → 正文再好也触发不了"的缺陷,只有路由层 + 可读性层交叉才能定位;单层评测会漏。

---

## 复现方式

```bash
# Tier 0
python scripts/check-trigger-jaccard.py
# Tier 2 词面路由
python evals/lexical_router.py        # -> evals/results/lexical-routing.json
# Tier 3 fixture(check 已 git 化)
ls evals/fixtures/check/webhook-svc   # git log: baseline commit + dirty 覆盖
# 6 次运行现场与自记日志
ls evals/runs/<skill>-<variant>/actions.log
```

详细判定过程:`evals/results/tier2-routing.md`、`tier1-readability.md`、`grading-*.json`。
