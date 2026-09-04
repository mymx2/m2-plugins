# 代理（Agents）

## 结论

子代理不是便携组件，也不是本仓库技能的使用方式：

- 各 harness 通过**特定工具**加载和使用代理，代理定义携带系列元信息（如 skills、mcps、tools）。
- 用技能关联代理的办法（技能内嵌 `agents/`）无法被 harness 加载为子代理。
- Agent Plugins Spec v1 的便携契约只定义 skills 和 MCP servers；agents 与 commands、hooks、rules 一样属于厂商扩展，使用方式看各厂商。

## 各厂商的子代理机制

| 厂商        | 机制                                                    | 元信息                              |
| ----------- | ------------------------------------------------------- | ----------------------------------- |
| Claude Code | 插件级 `agents/` 目录自动发现，`.md` + YAML frontmatter | description 等 frontmatter          |
| Qoder       | subagent，`.md` 声明                                    | tools / model / skills / mcpServers |
| Codex       | 无原生 agents 机制                                      | 提升为 skill 或合并进现有内容       |

适配时以各厂商当前文档为准。

## 本仓库的 agents/ 目录

根 `agents/` 存放从技能剥离的 persona brief，是**开发期资产，不是安装产物**：

- 技能运行时不依赖这些文件，安装副本中不存在。
- 用途：需要在某个 harness 把它们注册为真正的子代理时，从这里取用并按该厂商格式补齐元信息。
- 配套的激活目录、检查员路由与编排模式见本文档下文，同样由厂商决定复制哪些内容自行定制。

| 文件                                         | 来源技能 | 用途                    |
| -------------------------------------------- | -------- | ----------------------- |
| `agents/check/reviewer-security.md`          | check    | 安全审查 persona        |
| `agents/check/reviewer-architecture.md`      | check    | 架构审查 persona        |
| `agents/check/test-engineer.md`              | check    | 测试审查 persona        |
| `agents/check/web-performance-auditor.md`    | check    | Web 性能审查 persona    |
| `agents/health/inspector-context.md`         | health   | 深度审计：上下文 + 安全 |
| `agents/health/inspector-control.md`         | health   | 深度审计：控制 + 行为   |
| `agents/health/inspector-maintainability.md` | health   | 深度审计：AI 可维护性   |

## check：专家审查激活目录

check 技能本体不含专家定义（激活与否取决于 harness 是否有代理设施）。以下激活信号供厂商定制时选用；编排者读完整 diff 后凭判断（不是关键词匹配）决定激活哪些专家，brief 原文在 `agents/check/`。

### Security Reviewer（brief: `agents/check/reviewer-security.md`）

**Activate at:** Standard or Deep depth

Activate when the diff changes code an attacker could reach or influence: trust-boundary input, auth or crypto, credentials, or query/shell/path construction.

**Do not activate** for: pure UI changes, config file updates, test-only changes, documentation.

### Architecture Reviewer（brief: `agents/check/reviewer-architecture.md`）

**Activate at:** Standard or Deep depth

Activate when the diff changes how modules relate: boundaries, public APIs or signatures, cross-module dependencies, or a major dependency, rather than logic inside one module.

**Do not activate** for: single-file bug fixes, test additions, style changes, documentation updates.

### Test Engineer（brief: `agents/check/test-engineer.md`）

**Activate at:** Standard or Deep depth

Activate when the diff adds or changes behavior — new logic, bug fixes, or modified control flow — especially when tests are absent, stale, or assert implementation details.

**Do not activate** for: documentation, config-only, or static-content changes with no behavioral impact.

### Web Performance Auditor（brief: `agents/check/web-performance-auditor.md`）

**Activate at:** Standard or Deep depth, web projects only

Activate when the diff touches a web application's loading, rendering, interaction, or network paths — markup, styles, client JS, data fetching, asset handling. Its Metric-Honesty Rule forbids fabricated measurements: source-only analysis yields `potential impact` findings, not numbers.

**Do not activate** for: non-web projects (utility libraries, CLI tools, backend-only services) — there is no CWV surface and the audit would be noise.

### Adversarial Pass

**Activate at:** Deep depth only. No dedicated brief. Ask: "If I wanted to break this system through this specific diff, what would I do?" Four attack angles:

1. **Assumption violation** -- What does this code assume is always true? (format, ordering, range) What happens when it is not?
2. **Composition failures** -- What breaks when this new code interacts with the existing system under concurrent load or partial failure?
3. **Cascade construction** -- What sequence of valid operations leads to an invalid state?
4. **Abuse cases** -- What happens on the 1000th request, during a deployment, with two users editing the same resource simultaneously?

Report adversarial findings with confidence score; suppress below 0.60.

## health：深度审计检查员路由

health 技能本体按 lane 在会话内顺序分析。以下路由是厂商注册 inspector 代理时的素材，brief 原文在 `agents/health/`。

- **Inspector 1** (Context + Security, brief: `agents/health/inspector-context.md`): instruction surfaces, permissions, and skill/memory supply chain. Feed `CONVERSATION SIGNALS` section.
- **Inspector 2** (Control + Behavior, brief: `agents/health/inspector-control.md`): runtime, hook, MCP, and permission evidence.
- **Inspector 3** (AI Maintainability, brief: `agents/health/inspector-maintainability.md`): feed only `PROJECT SIGNALS`, `AI MAINTAINABILITY SUMMARY` or `AI MAINTAINABILITY DETAIL`, and concrete verifier/drift receipts. Launch only for deep health audits or explicit code-rot/AI-maintainability requests.
- **Fallback:** if a subagent fails, analyze that layer locally and note "(analyzed locally)".

## 编排模式

代理如何组合，配合上方激活目录使用。核心规则：**用户（或主会话）是编排者，persona 不调用其他 persona**。

### Endorsed Patterns

1. **Direct invocation (no orchestration)** — single persona, single perspective, single artifact. The default and cheapest. Use when the work is one perspective on one artifact describable in one sentence.
2. **Single-persona slash command** — a command that wraps one persona with the project's skills. Use when the same single-persona invocation repeats. Anti-signal: if the command body is mostly "decide which persona to call," delete it.
3. **Parallel fan-out with merge** — multiple personas operate on the same input concurrently; a merge step in the main context synthesizes a decision. Use when sub-tasks are genuinely independent, each benefits from its own context window, and the merge fits in the main context. Validate: independent? different _kinds_ of findings? merge fits? latency worth it? If any answer is no, fall back to direct invocation.
4. **Sequential pipeline as user-driven commands** — the user runs commands in order, carrying context between them. No orchestrator agent; the user is the orchestrator. Use when the workflow has dependencies and human judgment between steps adds value.
5. **Research isolation** — spawn a read-only research sub-agent that returns only a digest, keeping the main context focused. Use when the investigation result is much smaller than the input it consumes.

### Anti-Patterns

- **A. Router persona ("meta-orchestrator")** — a persona whose job is to decide which other persona to call. Pure routing with no domain value; adds paraphrasing hops and 2x token cost. Do it with slash commands / intent mapping instead.
- **B. Persona that calls another persona** — a reviewer that internally invokes another specialist. Defeats single-perspective design; loses context; multiplies failure modes. Instead, _recommend_ a follow-up audit in the report; the user or a command runs the second pass.
- **C. Sequential orchestrator that paraphrases** — an agent that runs the whole spec → plan → build sequence on the user's behalf. Loses human checkpoints, accumulates drift, doubles token cost. Keep the user as orchestrator.
- **D. Deep persona trees** — a top-level command calls a coordinator that calls a quality-coordinator that calls reviewers. Each layer adds latency/tokens with no decision value. Keep orchestration depth at most 1 (command → personas); merge in the main agent.

### Decision Flow

```text
Is the work one perspective on one artifact?
├── Yes → Direct invocation. Stop.
└── No  → Will the same composition repeat?
         ├── No  → Direct invocation, ad hoc. Stop.
         └── Yes → Are sub-tasks independent?
                  ├── No  → Sequential slash commands run by user (Pattern 4).
                  └── Yes → Parallel fan-out with merge (Pattern 3); validate checklist,
                           else fall back to single-persona command (Pattern 2).
```
