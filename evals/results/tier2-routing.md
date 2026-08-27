# Tier 2 — 触发路由判定(语义 × 词面 × 意图 owner)

评测对象:`plugins/dyc/skills/` 下 11 个技能的 description(路由器的唯一输入)。
用例:`evals/cases/*.json`,共 76 positive + 50 negative = 126 条触发 prompt,中英双语。

三种判定并排:

- **语义判定(§A)**:人工按"只看 description 时哪个技能最该接住"判 rank-1 / rank-2。这是 ground truth 的代理。
- **词面判定(lexical)**:`evals/lexical_router.py`,TF-IDF 余弦(latin 词 + CJK 二元组),对每个 prompt 跨 11 个 description 排名。模拟纯字面触发器(无语义理解的下限)。
- **意图 owner**:positive 的 owner = 被测技能自身;negative 的 owner = case 文件里标注的正确归属技能。

## 1. 总览

| 判定方式      | positive top-1 命中                                                                                | negative owner-outranks  |
| ------------- | -------------------------------------------------------------------------------------------------- | ------------------------ |
| 语义(§A)      | **65/66** 独立 positive(98.5%)(注:76 条里 10 条与 check 负例共享 prompt,去重后 66 条独立 positive) | 41/41 独立 negative PASS |
| 词面(lexical) | **28/76 (36.8%)**                                                                                  | **37/50 (74.0%)**        |

**读法**:语义路由(模型读了 description 后的判断)几乎全对,说明 description 的语义覆盖面是好的;词面路由命中低,说明**触发依赖语义理解而非关键词重叠**——prompt 故意不从 description 抄词(任务硬约束),所以字面 TF-IDF 自然接不住。词面表的用途是定位"description 里缺关键词锚点"的技能,这些技能在弱模型/纯关键词触发器下会掉单。

## 2. 语义判定的唯一 FAIL(BLOCKER)

| 技能  | prompt                                                                                      | 语义 rank-1 | 实际被抢  | 原因                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------- | ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| think | 产品甩过来一堆用户反馈,有报错的、有要功能的、有纯吐槽的,你帮我归归类,说说哪些该做哪些先放着 | **think**   | **check** | think 的 description 无任何 triage/归类/反馈 词汇;check 的 description 含 "issue or PR triage",triage 语义直接抢占。这是 §C Tier 1 也标出的同一缺陷(think/SKILL.md L104),两层互为证据。 |

**修复方向(改 description,不动正文)**:think description 末尾 cue 列表加一条 "or triaging a bundle of mixed requests/feedback into accept/reject buckets"。

## 3. 语义判定的薄边(非 FAIL,但 rank-1 与 rank-2 接近)

| 技能     | prompt 摘要               | rank-1   | rank-2 | 薄在哪                                                                                                                            |
| -------- | ------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| think    | IME 调研+选型建议         | think    | learn  | deliverable 是"选型建议"(决策)而非综述,归 think;但"先去把坑摸一遍"带研究动作,learn 有拉力                                         |
| think    | event sourcing go/no-go   | think    | learn  | 同上,research-then-decide 形状                                                                                                    |
| write    | 维护者 issue 回复         | write    | check  | write description 的 cue 列表未含 maintainer reply;靠 "prepare launch or social copy" 的语义泛化接住                              |
| write    | CONTRIBUTING.md proofread | write    | check  | **撞词**:proofread 同时出现在 check("doc proofreading")与 write("proofread")的 description。判给 write 因用户要的是"润好"而非"审" |
| learn    | OAuth 库对比文档          | learn    | think  | 边界 TB2:对比文档(综述)归 learn;若带"帮我选一个"则归 think                                                                        |
| learn    | 三框架渲染原理对比        | learn    | think  | 边界 TB4:同上                                                                                                                     |
| repowiki | 开源文档+图+源引用        | repowiki | write  | "produce the report" 整体产出归 repowiki;write 只接纯 prose                                                                       |
| hunt     | 上月 vs 今天截图表格重叠  | hunt     | ui     | 边界 UB2:有 known-good 基线(上月截图)→ hunt;ui 只在无基线时接                                                                     |
| hunt     | 字体 overhaul 后豆腐块    | hunt     | ui     | 边界 UB4:同上,有"rendered fine before" → hunt                                                                                     |
| ui       | 开关标签没对齐            | ui       | hunt   | 边界 UB1:第一眼美观抱怨无 known-good → ui                                                                                         |
| ui       | 首屏尴尬                  | ui       | hunt   | 边界 UB3:同上                                                                                                                     |

薄边不等于缺陷——ui/hunt、think/learn、check/write 三对边界的 description 里都写了互相的 route-to 提示,语义路由能正确分流。**唯一需要动的是 think 的 triage 盲区(§2)**。

## 4. 词面判定与语义判定的差异表(按技能聚合 positive top-1)

| 技能     | 词面命中 | 语义命中 | 差距 | 词面掉到谁身上(主要原因)                                                                              |
| -------- | -------- | -------- | ---- | ----------------------------------------------------------------------------------------------------- |
| check    | 1/9      | 9/9      | -8   | write(5 次,0.0 分并列)、think、repowiki——中文 prompt 与英文 description 无字面重叠时得分全 0,排名退化 |
| think    | 2/9      | 9/9      | -7   | write(5 次 0.0 并列)、forge、check、hunt                                                              |
| hunt     | 2/8      | 8/8      | -6   | write(3 次 0.0)、ui、check、read、think                                                               |
| learn    | 2/7      | 7/7      | -5   | write(4 次 0.0)、repowiki、forge                                                                      |
| read     | 1/6      | 6/6      | -5   | write(3 次 0.0)、forge、check                                                                         |
| chrome   | 1/5      | 5/5      | -4   | write(4 次 0.0)、hunt                                                                                 |
| ui       | 3/9      | 9/9      | -6   | write(6 次 0.0)                                                                                       |
| write    | 5/8      | 8/8      | -3   | health、learn、check(都是英文 prompt 里个别词撞上)                                                    |
| forge    | 4/5      | 5/5      | -1   | hunt(1 次,"failing the gate" 撞 hunt 的 "failing tests")                                              |
| health   | 4/5      | 5/5      | -1   | hunt(1 次,"tests keep getting" 撞 "failing tests")                                                    |
| repowiki | 3/5      | 5/5      | -2   | write(2 次 0.0)                                                                                       |

**规律**:词面 FAIL 高度集中在**中文 prompt**——description 全英文(仅 forge 中英双语),中文 prompt 与英文 description 的 CJK bigram 无交集,latin token 也没有,得分恒为 0,排名退化为任意。forge 是唯一中英双语 description,所以它的中文 prompt 词面命中最高(4/5)。

**这对路由的含义**:

- 生产触发器是**语义路由**(LLM 读 description 判断),不是关键词匹配,所以这一层不阻塞。
- 但 **forge 的双语 description 是一个可复制的加固模式**:对其他 10 个技能,若想给弱模型/关键词兜底,可在 description 的 cue 列表补 1-2 个中文场景词(如 think 补"评估/选型/拿主意",hunt 补"报错/线上坏了/回归",check 补"把关/ review 代码/发布前")。
- 词面把 5 个不同技能的 prompt 都掉到 **write**(0.0 分并列时的字母序 write 排前),说明 **write 的 description 覆盖面过宽**("draft, rewrite, proofread, localize, polish...")——在词面空间它是默认汇,在语义空间它也抢走 think 的 maintainer-reply、check 的 proofread。建议 write description 的 "Use when" 列表收窄,或把 "proofread" 与 check 的 "doc proofreading" 做显式分工(check 审不合规,write 改文字)。

## 5. negative 的词面 FAIL(13 条)

词面把被测技能排在 owner 之前(或同分)的 13 条:

| tested | owner | prompt 摘要                 | 词面 top-1 | 语义是否也会错                                                                            |
| ------ | ----- | --------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| chrome | hunt  | landing page 9s 加载定位    | ui         | 语义 PASS(hunt outranks chrome)                                                           |
| forge  | check | 插件代码质量审一遍          | forge      | 语义 PASS(check)——forge description 自带 "reviewing plugin code quality (route to check)" |
| forge  | think | plugin marketplace 架构规划 | forge      | 语义 PASS(think)                                                                          |
| health | check | codebase 注入风险审计       | health     | 语义 PASS(check)——health 的 "security review" 与 check 的 "security" 撞,靠 route-to 分流  |
| learn  | write | meeting notes 变 one-pager  | learn      | 语义 PASS(write)                                                                          |
| think  | write | 投资人邮件改软              | write      | 语义 PASS(write)                                                                          |
| think  | check | 两份方案挑毛病别改          | write      | 语义 PASS(check)                                                                          |
| think  | learn | 三框架对比写文档            | write      | 语义 PASS(learn)                                                                          |
| ui     | hunt  | 字体 overhaul 豆腐块        | think      | 语义 PASS(hunt)                                                                           |
| write  | check | 公告按规范标不合规先别改    | write      | 语义 PASS(check)——"先别改"是关键,write 的 rulebook audit 显式 route to check              |
| write  | think | 本地化落地流程规划          | write      | 语义 PASS(think)                                                                          |
| write  | check | 投稿文档把关别动稿          | write      | 语义 PASS(check)                                                                          |
| write  | check | onboarding docs audit       | write      | 语义 PASS(check)                                                                          |

**要点**:13 条词面 negative FAIL,语义全部 PASS。原因集中在两类——

1. **write 是词面默认汇**(8/13),中文 prompt 零分时字母序把它顶上来;
2. **description 里已经写了 route-to 的技能**(forge/health/write),语义路由读得懂"这个该转给别人",词面读不懂。

这再次印证:**生产语义路由足够稳,词面层的 FAIL 是加固项而非缺陷**。

## 6. 结论与行动项

| #   | 行动                                                                                                                                     | 类型           | 严重度      | 依据                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------- | ------------------------------------- |
| 1   | think description cue 列表加 triage/归类 语义("triaging a bundle of mixed requests/feedback")                                            | 改 description | **BLOCKER** | §2 语义 FAIL + §C think L104 双层证据 |
| 2   | write description 收窄 "Use when",或与 check 的 proofread 显式分工                                                                       | 改 description | STRUCT      | §4 write 是词面默认汇 + §3 撞词薄边   |
| 3   | 9 个纯英文 description 的技能(think/check/hunt/ui/read/learn/health/chrome/repowiki)在 cue 列表补 1-2 个中文场景词,复制 forge 的双语模式 | 改 description | INCR(加固)  | §4 中文 prompt 词面全 0 退化          |
| 4   | 三对边界(ui/hunt、think/learn、check/write)的 route-to 提示已生效,不动                                                                   | 不动           | —           | §3 薄边全部 PASS                      |

词面路由明细数据:`evals/results/lexical-routing.json`(126 条,含 top-3 得分)。
