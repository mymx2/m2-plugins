# Skills (m2-plugins)

AI Agent 插件与技能的策划目录，遵循 Agent Plugins Spec v1.0.0，支持 Claude Code / Qoder / Codex 多厂商适配。`plugins/` 下每个子目录是独立插件，可随时新增。

## Commands

| Command                                               | Description                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `vp install`                                          | 安装依赖（必须用 vp，不用 npm/pnpm/yarn）                                 |
| `vp run lint`                                         | Lint 全部：`vp lint`（TS）+ `ruff check scripts/ plugins/`（Python）      |
| `vp run fmt`                                          | 格式化全部：`vp fmt`（TS）+ `ruff format scripts/ plugins/`（Python）     |
| `vp run test`                                         | 一键门禁：vitest + evals 单测 + Jaccard + 词面路由不退化（见下）          |
| `vp check`                                            | TypeScript 类型检查 + lint（CI 中 `vp check` 覆盖了 lint + type）         |
| `vp run validate:schema`                              | 校验所有插件的 JSON Schema（ajv）                                         |
| `vp run init`                                         | 版本填充：package.json → 插件/厂商 manifest + marketplace（末尾自动 fmt） |
| `vp run validate:version`                             | 校验全链路版本与 package.json 一致（漂移时退出 1）                        |
| `vpx tsx scripts/validate-schemas.ts --plugin <name>` | 校验指定插件的 JSON Schema                                                |
| `python scripts/validate_repo.py .`                   | Agent Plugins Spec v1.0.0 仓库结构验证（全量）                            |
| `python scripts/validate_repo.py . -p <name>`         | 验证指定插件结构                                                          |
| `vp run up`                                           | 依赖更新检查（taze -r -w -i）                                             |
| `python scripts/check-trigger-jaccard.py`             | 11 个技能 `when_to_use` 两两 Jaccard（≥0.5 退出 1）                       |
| `python -m pytest evals/tests/ -q`                    | evals 设施单测（临时目录，不碰真实 `evals/runs/`）                        |
| `python evals/lexical_router.py`                      | Tier 2 词面路由，重写 `evals/results/lexical-routing.json`                |

注意：`vp lint` 是 Vite+ 内置（仅 TS），`vp run lint` 才是完整流程（TS + Python）。`vp fmt` 同理。

## Architecture

### 插件结构

每个插件遵循 Agent Plugins Spec，目录名 kebab-case：

```
plugins/<name>/
  plugin.json              # 根 manifest（厂商适配的事实源；version 由根 init.ts 从 package.json 填充），extensions 字段声明多厂商适配
  .claude-plugin/          # 厂商适配目录，由 init.ts 生成，不手动维护
  .codex-plugin/
  .qoder-plugin/
  skills/<skill>/SKILL.md  # 技能定义（frontmatter: name + description，description 带 "Use when..."）
```

插件内的 `references/`、`agents/`、`scripts/`、`rules/` 目录均为可选。

### 仓库级基础设施

- `schemas/`：JSON Schema 定义，`validate-schemas.ts` 自动映射校验
- `scripts/`：仓库级校验工具（TS + Python），测试在 `scripts/tests/`
- `evals/`：11 个技能的三层行为评测设施（Jaccard / 词面路由 / 行为抽样），含 `cases/`、`fixtures/`、`runs/`、`results/`、`tests/`；跑法与阈值见 `evals/README.md`
- `vendor/`：Git submodules（上游参考源），不参与构建（lint/fmt/test 全局忽略）
- `.claude-plugin/marketplace.json`：Claude Code marketplace 注册表（受 schema 校验）
- `.agents/plugins/marketplace.json`：Codex marketplace 注册表
- `.qoder-plugin/marketplace.json`：Qoder marketplace 注册表
- `.github/workflows/plugin-gate.yml`：CI 门禁（push/PR to main）
- `.vite-hooks/`：Git hooks（`pre-commit` → `vp staged`；`commit-msg` → Conventional Commits 校验）

**每个插件必须同时在三个 marketplace 注册。**

### 配置入口

- `package.json`：npm scripts
- `vite.config.ts`：lint/fmt/staged/test 选项（vendor、`__*`、`pnpm-workspace.yaml` 忽略）
- `pnpm-workspace.yaml`：依赖 catalog（`catalogMode: prefer`）
- `pyproject.toml`：ruff 配置（line-length 120, py312）
- `.editorconfig`：indent style space/2, charset utf-8, max_line_length 100
- `.gitattributes`：全局 `text=auto eol=lf`；`.bat`/`.cmd` 保持 CRLF
- `.npmrc`：`confirmModulesPurge=false`

### IDE 约定

`.vscode/settings.json` 配置 `oxc.oxc-vscode` 为默认 formatter，`formatOnSave` 启用，保存时自动 fix。扩展推荐：`VoidZero.vite-plus-extension-pack`。

## Current Plugins

| Plugin  | Description                                                                                              | Skills |
| ------- | -------------------------------------------------------------------------------------------------------- | ------ |
| **dyc** | Engineering workflow skills: think, check, hunt, ui, read, write, learn, health, forge, chrome, repowiki | 11     |

## Code Style

- **TypeScript**：ESNext, strict, bundler moduleResolution, `verbatimModuleSyntax`, `erasableSyntaxOnly`（见 `tsconfig.json`）
- **Python**：ruff, line-length 120, py312；插件内技能脚本（`plugins/<name>/skills/*/scripts/*.py`）放宽 E501/E701/E702/E741/F841/F821（见 `pyproject.toml`）
- **Markdown**：`vp fmt` 格式化，singleQuote, semi=false, arrowParens=avoid
- **命名**：插件和技能目录均 kebab-case；frontmatter `name` 必须匹配目录名
- **Schema 映射规则**：
  - `plugins/<name>/plugin.json` → `schemas/plugin.schema.json`
  - `plugins/<name>/mcp.json` → `schemas/mcp.schema.json`
  - `plugins/<name>/.claude-plugin/plugin.json` → `schemas/claude-code-plugin-manifest.schema.json`
  - `.claude-plugin/marketplace.json` → `schemas/claude-code-marketplace.schema.json`（项目级）

## Testing

`vp run test` 是单命令门禁，串起两层：

1. `vp test`：`scripts/tests/` 下全部 vitest 用例（超时 120s）。`vendor/**`、`projects/**`、`evals/fixtures/**`、`evals/runs/**` 排除（后两者是 fixture 资产，含 node:test 格式文件，不是 vitest 用例）。
2. 后续四步（在 `package.json` 的 `test` script 里串联）：`python -m pytest evals/tests/ -q` → `check-trigger-jaccard.py` → `lexical_router.py` → `compare_routing.py` 基线对比。任一步失败整条红。

改技能触发面后在本地跑 `vp run test` 即可覆盖"非人员审核"的全部自动约束；Tier 1/Tier 3 的语义判定仍需人工抽样，不在此列。

测试覆盖（测试文件 → 职责）：

- `validate-repo.test.ts`：spawn `validate_repo.py`（Spec 结构验证）+ forge 插件级 7 门校验
- `validate-schemas.test.ts`：JSON Schema 校验（含项目级 marketplace.json）
- `skill-frontmatter.test.ts`：技能 frontmatter 校验
- `checks-content.test.ts`、`markdown-fragments.test.ts`、`validate-skill.test.ts`

## Git Hooks & CI

### Pre-commit

`.vite-hooks/pre-commit` → `vp staged`（对 staged 文件运行 `vp check`）。

### Commit Message

`.vite-hooks/commit-msg` 校验 Conventional Commits 格式：

```
<type>(<scope>): <subject>
```

允许 type：`feat | fix | refactor | perf | test | infra | deps | docs | chore | wip | release`。Subject ≤100 字符。merge 和 initial commit 自动跳过。

### CI: Plugin Gate

`.github/workflows/plugin-gate.yml`（push/PR to main）：

1. `setup-vp` action 安装 vp + Node + 依赖
2. `setup-python` + `pip install ruff`
3. `vp check`（TS lint + type check）
4. `vp run validate:version`（全链路版本与 package.json 一致，漂移即红）
5. `ruff check scripts/ plugins/ && ruff format --check scripts/ plugins/`（Python）
6. `vp test`（全部测试，含 validate_repo.py + schema 校验）

## Environment

无需环境变量。本地依赖：

- `vp`（Vite+ 二进制）：全局安装
- `python 3.12+`：ruff lint 和 validate_repo.py 需要

## Gotchas

- **vp 优先**：永远不用 npm/pnpm/yarn 直接操作；vp 是全局独立二进制，不是 npm 包
- **vp install 必须**：`prepare` 脚本需要 `vp config`，没有 vp 则 install 失败
- **vendor 不参与构建**：lint/fmt/test 的 ignorePatterns 都包含 `vendor/**`
- **plugin.json 是唯一事实源**：厂商目录下的 plugin.json 由 init.ts 生成，不手动维护
- **版本号事实源是 package.json**：改版本只动 package.json，跑 `vp run init` 填充到全部 manifest 和 marketplace；`vp run validate:version` 校验漂移
- **init.ts 必须幂等**：重复运行结果一致，每次都从标准源重新生成
- **三个 marketplace**：新插件必须同时注册 `.claude-plugin/marketplace.json`（Claude Code）、`.agents/plugins/marketplace.json`（Codex）和 `.qoder-plugin/marketplace.json`（Qoder）
- **技能校验门禁**：description 40-500 字且必须包含 "Use when..." 触发句式；推荐 section: Overview / When to Use / Common Rationalizations / Red Flags / Verification
- **跨技能引用**：按名引用（不用路径），路径引用过不了 isolation 门
- **when_to_use 用半角逗号**：校验器按 `,` 切分触发词，改成全角会把整串解析成一个关键词，触发区分度门失效
- **目录不留空**：技能目录下只在有文件时创建子目录
- **submodule 同步**：vendor/ 改动后更新 `SYNC.md` 中的 SHA 和日期，submodule pointer 与 SYNC.md 一起提交
- **commit message 格式**：Conventional Commits，`<type>(<scope>): <subject>`，commit-msg hook 强制校验
- **`projects/` 目录被 gitignore**：不要在 `projects/` 下存放需要提交的内容

## 维护规则（references 长期可靠）

技能文档的可靠性靠以下规则维持；新增或修改 reference 时逐条过：

- **加规则先过删除测试**：往本文件或任何 skill 加规则前，先问"删掉它 agent 会犯错吗"；不会就不写。流程礼节、可推知的默认值、风格偏好都不是规则，规则只写防错。
- **一级深度**：`SKILL.md` 可以指向 `references/`，reference 不再指向另一个 reference；跨文件提及一律按名（`xxx` reference），不写 `references/xxx.md` 路径。跨 skill 提及同样按名（如 check skill 的 xxx reference），跨 skill 路径在安装副本里是死链。
- **同主题双副本必须登记**：两份文件覆盖同一主题时，要么逐条同步并在文件头注明与谁同步，要么有意分化并在文件头注明正本。副本不可互相引用（路径引用过不了 isolation 门，按名提及）。
- **命令与阈值对照实现**：文档写命令必须实测可跑；写阈值必须对照 scripts 源码（校验器阈值以 `checks-content.ts` 为准）；引用外部 CLI 的行为以该 CLI 当前版本的 `--help` 或源码为准。行数、版本号、模型 ID 这类易腐精确值宁删不留。
- **脚本与 section 名对账**：文档引用的脚本名、子命令、输出 section 标题必须与脚本实际输出一致（grep 实证，注意连字符）。
- **vendored 快照标 sync**：从上游复制的生成物（如 design-md-format-spec.md）在文件头注明本仓库内可执行的 sync 命令与最近同步版本。
- **变更后跑门禁**：改任何 skill 内容后跑 `vpx tsx plugins/dyc/skills/forge/scripts/validate-skill.ts <skill 目录>`、`python scripts/validate_repo.py .`、`vp test`。
- **同类异常第二次出现**：固化为校验器或 lint 规则，不靠 prompt 修补。

## evals 维护（改技能 description / when_to_use 时）

`evals/` 是技能触发与行为的评测设施，改技能触发面时必须同步，否则评测口径悄悄漂移：

- **改 `when_to_use` 后必跑** `python scripts/check-trigger-jaccard.py`，worst pairwise 必须 < 0.5（CI 门禁）。
- **改 description 后必跑** `python evals/lexical_router.py` 并重跑基线对比：description 由 `load_descriptions()` 从 SKILL.md frontmatter 现读（无副本），改完跑 `python evals/compare_routing.py evals/results/lexical-routing.baseline.json evals/results/lexical-routing.json`，命中数下降即退化。
- **词面路由合理变化时更新基线**：把新的 `lexical-routing.json` 复制为 `lexical-routing.baseline.json` 一并提交。
- **evals 脚本自身改动后必跑** `python -m pytest evals/tests/ -q`；测试只用临时目录，不得在测试里碰真实 `evals/runs/`（上一轮 `actions.log` 被 `--rebuild` 清掉的事故即源于此）。
- **evals/ 需入库**：CI 的"词面路由不退化"是"当前结果 vs 入库基线"的 diff，`evals/` 不进仓库则该门禁无对比对象。

## Workflow

### 添加新插件

1. 在 `plugins/<name>/` 创建目录（kebab-case）
2. 编写 `plugin.json`（符合 `schemas/plugin.schema.json`，`$schema` 和 `name` 必填）
3. 按需添加 extensions（`.claude-plugin/`、`.codex-plugin/`、`.qoder-plugin/`）及各厂商 `init.ts`
4. 运行 `vp run init` 生成各厂商 manifest，并从 package.json 填充/同步版本
5. 运行 `python scripts/validate_repo.py . -p <name>` 确认结构合规
6. 运行 `vpx tsx scripts/validate-schemas.ts --plugin <name>` 确认 schema 合规
7. 在 `.claude-plugin/marketplace.json`、`.agents/plugins/marketplace.json` 和 `.qoder-plugin/marketplace.json` 分别注册条目（version 字段留由 `vp run init` 同步）
8. 更新上方 **Current Plugins** 表

### 为插件添加新技能

1. 在 `plugins/<name>/skills/<skill-name>/` 创建目录（kebab-case）
2. 编写 `SKILL.md`（含 frontmatter: name + description，description 带 "Use when..." 触发词）
3. 按需添加 `references/`、`agents/`、`scripts/` 子目录
4. 运行 `vpx tsx plugins/dyc/skills/forge/scripts/validate-skill.ts plugins/<name>/skills/<skill-name>` 确认七门全绿
5. 运行 `vp run lint` 确认风格合规

### 同步上游 vendor

1. `git submodule update --remote vendor/<name>`
2. Diff 新上游状态与 `SYNC.md` 中记录的 SHA
3. 更新 `SYNC.md` 的 SHA 和日期，一起提交

### 校验全仓库

```bash
vp run lint                             # TS + Python 风格
vp test                                 # 单元测试 + 结构验证 + schema 校验
vp run validate:schema                  # 全部插件的 JSON Schema 校验（独立运行）
python scripts/validate_repo.py .       # Agent Plugins Spec 结构验证（独立运行）
```

注意：`vp test` 已包含 `validate_repo.py` 和 schema 校验（通过 `scripts/tests/` 中的 spawn 测试），独立运行上述命令用于快速排查特定问题。
