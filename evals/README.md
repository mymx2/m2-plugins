# evals/ — 三层行为评测设施

评测对象:`plugins/dyc/skills/` 下 11 个技能。全部产物在本目录,不改技能本体。
报告入口:`REPORT.md`。本文件说明每层怎么跑、fixture 怎么重建、结果怎么读、多少算过。

入库范围:`cases/`、`fixtures/`、`results/`、`tests/`、各 `.py`、`REPORT.md`、本文件入库;
`runs/`(Tier 3 运行现场)与 `__pycache__/` 不入库(见根 `.gitignore`)——`runs/` 由
`run_tier3.py prepare` 从 `fixtures/` 一键重建,产物是过程性现场,`results/grading-*.json`
才是沉淀结论。

## 层总览

| 层                      | 测什么                                                     | 脚本 / 入口                                           | 产物                                                | 通过线                                                                 |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| **Tier 0** 静态触发面   | 11 个 `when_to_use` 两两字面重叠                           | `python scripts/check-trigger-jaccard.py`             | 终端打印                                            | worst pairwise Jaccard **< 0.5**                                       |
| **Tier 2** 触发路由     | 126 条 prompt(76 positive + 50 negative)语义 / 词面 top-1  | `python evals/lexical_router.py`                      | `results/lexical-routing.json`                      | 语义判定以 `results/tier2-routing.md` 为 ground truth;词面仅作加固参考 |
| **Tier 3** 行为抽样     | hunt / check / write 各 baseline + 压力变体,6 次子代理执行 | `python evals/run_tier3.py` + `python evals/grade.py` | `runs/<skill>-<variant>/`、`results/grading-*.json` | 每条期望 PASS/FAIL,压力变体核心契约必须全守住                          |
| **Tier 1** 弱模型可读性 | think / check 逐句照做视角                                 | 人工审查                                              | `results/tier1-readability.md`                      | BLOCKER=0                                                              |

## 各层跑法

### Tier 0 — 触发面 Jaccard

```bash
python scripts/check-trigger-jaccard.py
```

打印全部技能对的 Jaccard 值;有任一对 ≥ 0.5 时退出码 1。改任何技能的 `when_to_use` 后必跑。

### Tier 2 — 词面路由

```bash
python evals/lexical_router.py
```

重写 `results/lexical-routing.json`(126 条,含 top-3 得分)。description 由 `load_descriptions()`
从 11 个 SKILL.md 的 frontmatter **现读**,无内嵌副本——改 description 即生效,不存在"改了就忘
同步"的窗口。早期版本曾手抄副本,结果 forge 的全角冒号被抄成半角,正是这次重构消灭的漂移。

读法:

- `positive top-1 hit: X/76` 是纯字面 TF-IDF 的下限指标,**不是生产指标**。生产路由是语义路由
  (LLM 读 description 判断),语义判定结果在 `results/tier2-routing.md` §A。
- 词面表的用途是定位"缺关键词锚点"的技能:得分恒 0 的中文 prompt 会在并列时按字母序退化,
  观察哪些技能被零分并列顶上去,可发现 description 覆盖面过宽的"默认汇"。

### Tier 3 — 行为抽样(6 次)

分两步:**prepare 铺现场** → **执行 + grading**。

```bash
# 1. 铺全部 6 次现场(复制 fixture、生成 EXECUTOR-PROMPT.md);已存在则跳过,--rebuild 强制重建
python evals/run_tier3.py prepare --all --rebuild

# 或单次
python evals/run_tier3.py prepare --skill write --variant baseline
```

prepare 只做两件事:把 `fixtures/` 下对应技能的 fixture 复制到 `runs/<skill>-<variant>/`,
并写一份 `EXECUTOR-PROMPT.md`(含工作目录、技能路径、eval prompt、压力设定、actions.log 格式)。
**实际执行由子代理完成**(脚本不持有模型句柄):把 `EXECUTOR-PROMPT.md` 作为系统提示启动一个
子代理,它在 run 目录内干活并自记 `actions.log`。

执行完成后 grading:

```bash
# 2a. 打包 grading 提示词(run 目录 + case expectations + 判定规则)
python evals/run_tier3.py pack --skill write --variant baseline > /tmp/grader-prompt.md

# 2b. 把提示词喂给 LLM 评审员,拿到符合 grader.md 格式的 JSON,然后 merge 落盘
python evals/grade.py merge evals/runs/write-baseline --input /tmp/graded.json
```

merge 会校验字段齐全、重算 summary(pass_rate),默认写到 `results/grading-<skill>-<variant>.json`。

#### fixture 重建

| 技能  | 源                            | 说明                                                                                                                                                                                             |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| hunt  | `fixtures/hunt/inventory/`    | 整目录复制(pre-fix 状态,`npm test` 红)                                                                                                                                                           |
| check | `fixtures/check/webhook-svc/` | **已 git 化**:`git log` 有 `baseline: clean webhook-svc` 一个 commit,工作区有 dirty 覆盖(eval RCE / token 泄漏 / 未用依赖)。重建时连 `.git` 一起复制,`git status` 应显示 3 个 M + 1 个 untracked |
| write | `fixtures/write/draft-zh.md`  | 单文件复制(含 em-dash、半角标点、"总的来说"矛盾段)                                                                                                                                               |

check fixture 的"git 化"是手工做的:`fixtures/check/_src/base/` 是干净基线,`_src/dirty/` 是
覆盖层;先把 base 铺进 `webhook-svc/` 并 `git init && git commit` 打出 baseline commit,再用
dirty 覆盖对应文件(不 commit),得到"base commit + dirty 工作区"的现场。`_src/` 保留这两份
原始材料,`webhook-svc/` 损坏时可对照重建。

### Tier 1 — 弱模型可读性

人工审查,无脚本。视角是"不看示例、不做推理链、逐句照做的弱模型",按 BLOCKER / STRUCT / INCR
三级记录在 `results/tier1-readability.md`。改 think/check 正文措辞后应重审对应行号。

## 结果怎么读

- `results/grading-*.json`:`summary.pass_rate` 是执行通过率;`expectations[].evidence` 必须
  引用 actions.log 行号或产物 file:line,不接受"我觉得"。`eval_feedback` 是评审员对**期望本身**
  的反馈——出现"期望与技能规则冲突"时,优先修期望(见 `cases/write.json` 的先例),不改技能。
- 压力变体的意义:baseline 全 PASS 只说明"能干",压力变体(时间 / 权威 / 沉没成本)全 PASS
  才说明"守得住"。压力变体的 FAIL 权重高于 baseline 的装饰性 FAIL。

## evals 自身的可靠性(测试与门禁)

evals/ 三个 Python 脚本有自己的单测,放 `evals/tests/`,全部用临时目录构造 fixture/run,
**不碰真实 `evals/runs/`**:

```bash
python -m pytest evals/tests/ -q
```

锁定的不变量包括:`lexical_router` 的 CJK bigram 切分与"零分并列按字母序最后(write)退化"
的仲裁行为、`grade.py merge` 的字段校验与 summary 重算口径、`run_tier3.py prepare` 的
"已存在 run 目录默认跳过不静默覆盖"(上一轮 actions.log 事故的根因)与 check fixture 的
`.git` 随行 + dirty 状态形态。

CI 门禁(`.github/workflows/plugin-gate.yml`)已加两步:

- `evals 设施单测`:跑上面这条 pytest;
- `evals 词面路由不退化`:重跑 `lexical_router.py`,用 `compare_routing.py` 与入库的
  `results/lexical-routing.baseline.json` 对比,命中数下降即红;顺带跑 Tier 0 的
  `check-trigger-jaccard.py`。

**生效前提**:`evals/` 必须入库(当前是 untracked),且 `results/lexical-routing.baseline.json`
要随之提交——`compare_routing.py` 是"当前结果 vs 入库基线"的 diff,基线文件不在仓库里
这一步就没有对比对象。改 description 后若词面路由**合理**变化(命中数上升或不降),重跑
`lexical_router.py` 后把新的 `lexical-routing.json` 复制为 `lexical-routing.baseline.json`
一并提交即可。

## CI 入口建议(只写文档,不接真实 CI)

适合**门禁**(每次 PR 自动跑,失败即拦):

- **Tier 0 Jaccard**:纯静态、秒级、确定性。`when_to_use` 撞车是回归高发区,必须门禁。
- **Tier 2 词面路由**:确定性脚本,可门禁"相对基线不退化"——把 `results/lexical-routing.json`
  入库,PR 重跑后 diff,positive top-1 命中数不得下降、think triage prompt 不得退回 check。
  语义判定本身依赖 LLM,不能进确定性门禁,但可以用词面层当金丝雀。

适合**抽样人工**(定时或发版前,不拦 PR):

- **Tier 1 可读性**:本质是审查,弱模型视角需要人判断,入门禁会噪声过大。建议每次改
  think/check 正文后抽样重审。
- **Tier 3 行为抽样**:6 次子代理执行成本高、有非确定性,且 grading 依赖 LLM 评审员。建议
  发版前或技能本体大改后全量重跑 6 次,日常改动抽 1-2 个相关技能跑。
