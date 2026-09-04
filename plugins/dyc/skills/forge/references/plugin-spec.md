# Agent Plugins Spec 精要

根 `plugin.json` 是插件的唯一事实源。此文件蒸馏 [Agent Plugins Spec 1.0.0](https://github.com/agentplugins/agent-plugins-spec) 中插件作者需要知道的全部规则。

## plugin.json 标准字段

| 字段          | 类型     | 必填 | 约束                                                                          |
| ------------- | -------- | ---- | ----------------------------------------------------------------------------- |
| `$schema`     | string   | ✅   | 规范版本标识，如 `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` |
| `name`        | string   | ✅   | 见命名规则                                                                    |
| `version`     | string   |      | SemVer 推荐                                                                   |
| `description` | string   |      | 简短描述                                                                      |
| `author`      | object   |      | `{ name, email, url }`，仅这三个子字段                                        |
| `homepage`    | string   |      | 文档或主页 URL                                                                |
| `repository`  | string   |      | 源码仓库 URL                                                                  |
| `license`     | string   |      | SPDX 标识符推荐                                                               |
| `keywords`    | string[] |      | 搜索和发现标签                                                                |
| `extensions`  | object   |      | 厂商特定数据，见 [extensions-pattern.md](extensions-pattern.md)               |

**闭包约束**：除上述字段外，`plugin.json` 不允许任何其他顶层字段。未知字段会被报告并忽略（不致命），但客户端不会对未知字段赋予语义。厂商特有数据必须放在 `extensions` 下。

最小有效 manifest：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "my-plugin"
}
```

推荐完整 manifest（从零创建时使用此模板，按需裁剪）：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "One sentence in English",
  "author": { "name": "Author Name" },
  "homepage": "https://example.com",
  "repository": "https://github.com/org/repo",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "extensions": {
    ".claude-plugin": { "init": ".claude-plugin/init.ts" },
    ".qoder-plugin": { "init": ".qoder-plugin/init.ts", "skills": "./skills/" },
    ".codex-plugin": { "init": ".codex-plugin/init.ts" }
  }
}
```

## 命名规则

| 约束   | 要求                   |
| ------ | ---------------------- |
| 长度   | 1–64 字符              |
| 字符集 | `a-z`、`0-9`、`-`、`.` |
| 首尾   | 必须是字母或数字       |
| 连续   | 不允许 `--` 或 `..`    |

合法：`my-plugin`、`acme.tools`、`lint3r`、`a`
非法：`My-Plugin`（大写）、`-start`（首字符非法）、`has--double`（连续连字符）

## 路径安全

1. 插件包内的路径必须以 `./` 开头，相对于插件根解析。
2. 路径解析后不得逃出插件根目录（symlink、junction 等不算）。
3. 违反路径安全时，客户端按最窄失败边界处理（跳过该组件，不拒绝整个插件）。

```json
{ "command": "./bin/server" }      // ✅ 合法
{ "command": "../bin/server" }     // ❌ 逃出根目录
{ "command": "data" }              // ❌ 非 ./ 开头的路径
```

## 组件发现

客户端从固定位置发现组件，`plugin.json` 不能覆盖这些位置：

| 组件类型    | 固定位置   | 匹配模式              |
| ----------- | ---------- | --------------------- |
| Skills      | `skills/`  | 子目录中含 `SKILL.md` |
| MCP servers | `mcp.json` | JSON 配置             |

- **缺失 ≠ 错误**：组件位置不存在时，客户端不报错，继续加载其他组件。
- **类型错误 = 该组件无效**：如 `skills` 不是目录或 `mcp.json` 不是文件，跳过该组件类型。
- **不递归搜索**：仅扫描 `skills/` 的直接子目录。
- **不声明不存在的组件**：manifest 或 extensions 中声明的组件路径（如 `skills: "./skills/"`、`rules: "./rules/"`）对应目录或文件必须实际存在。声明了但不存在不会致命（客户端跳过），但属于意图不一致，校验器会报 warning。

## Skills 组件

每个 skill 是 `skills/<name>/SKILL.md`，遵循 [Agent Skills 规范](https://agentskills.io/specification)。

```text
skills/
└── deploy/
    ├── SKILL.md
    ├── scripts/
    │   └── rollback.sh
    ├── references/
    │   └── runbook.md
    ├── examples/              # 可选 — 用法示例
    └── schemas/               # 可选 — JSON Schema 定义
```

不合规范的 skill 被跳过，不影响其他组件加载。

## mcp.json

位于插件根的 `mcp.json` 定义 MCP 服务器配置。必须含 `$schema` 和 `mcpServers` 两个顶层字段，无其他字段。

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "local-validator": {
      "type": "stdio",
      "command": "./bin/validator",
      "args": ["--data", "${PLUGIN_DATA}/validator"],
      "env": { "CONFIG": "${PLUGIN_ROOT}/config.json" },
      "cwd": "${PLUGIN_ROOT}"
    },
    "remote-api": {
      "type": "streamable-http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

### 三种传输类型

| type              | 必填字段  | 说明                                |
| ----------------- | --------- | ----------------------------------- |
| `stdio`           | `command` | 本地进程，支持 `args`、`env`、`cwd` |
| `streamable-http` | `url`     | 远程 HTTP，支持 `headers`           |
| `sse`             | `url`     | 旧版 HTTP+SSE（已弃用，可选支持）   |

- `command` 必须是单个可执行 token（裸名称或 `./` 路径），不是 shell 命令。
- 远程 URL 必须绝对、无用户信息、无 fragment；非 loopback 必须 HTTPS。
- `mcp.json` 的 `$schema` 版本必须与 `plugin.json` 一致，否则 MCP 配置无效（其他组件不受影响）。
- **禁止空 scaffold**：如果插件不需要 MCP，不要创建空的 `mcp.json` 或 `{ "mcpServers": {} }`。空对象没有实际意义，校验器会报 warning。需要时再创建，且至少包含一个 server 定义。

## 环境变量与占位符

客户端启动插件子进程时必须提供：

| 变量          | 含义                               |
| ------------- | ---------------------------------- |
| `PLUGIN_ROOT` | 插件根目录的绝对路径               |
| `PLUGIN_DATA` | 客户端管理的持久化数据目录（可写） |

占位符 `${PLUGIN_ROOT}` 和 `${PLUGIN_DATA}` 在 `args`、`env`（值）、`cwd` 中展开：

- 展开是单次、非递归的文本替换。
- 不展开 `command`、`env` 的 key。
- `env` 中不得包含名为 `PLUGIN_ROOT` 或 `PLUGIN_DATA` 的条目。

## extensions 字段

`extensions` 是 `plugin.json` 中放置厂商特有数据的唯一合法位置。

- 必须是对象，key 为厂商命名空间，value 为对象。
- 非对象的 `extensions` 会被报告并忽略。
- 客户端忽略自己不认识的命名空间，不校验其内容。

详见 [extensions-pattern.md](extensions-pattern.md)。

## 客户端扩展目录

厂商特有文件放在以命名空间命名的顶层目录中：

```text
my-plugin/
├── plugin.json
├── skills/
│   └── summarize/SKILL.md
└── com.example.client/
    └── hooks/hooks.json
```

## 版本

- `$schema` 标识规范版本（非插件版本）。
- 插件 `version` 推荐 SemVer。
- `$schema` 和 `mcp.json` 的 `$schema` 必须匹配。

## 标准目录布局参考

```text
my-plugin/
├── plugin.json                 # 必填 — 唯一事实源
├── mcp.json                    # 可选 — MCP 服务器配置
├── README.md                   # 推荐 — 插件说明
├── LICENSE                     # 推荐 — 许可证
├── CHANGELOG.md                # 可选 — 变更日志
│
├── skills/                     # 可选 — 便携技能（仅一级子目录被发现）
│   └── <skill-name>/
│       ├── SKILL.md            #   必填 — 技能定义
│       ├── references/         #   可选 — 参考文档
│       ├── scripts/            #   可选 — 可运行脚本
│       ├── examples/           #   可选 — 用法示例
│       ├── schemas/            #   可选 — JSON Schema
│       └── assets/             #   可选 — 静态资源
│
├── hooks/                      # 可选 — 客户端钩子（非便携）
├── agents/                     # 可选 — 代理定义（非便携，厂商扩展）
├── commands/                   # 可选 — 命令定义（非便携）
├── rules/                      # 可选 — 规则文件（非便携）
├── bin/                        # 可选 — 可执行文件
├── canvases/                   # 可选 — Canvas 组件
├── workflows/                  # 可选 — 工作流定义
├── assets/                     # 可选 — 插件级静态资源
├── scripts/                    # 可选 — 插件级脚本
│
└── .<vendor>-plugin/           # 衍生 — 厂商适配目录（init.ts 生成）
    ├── init.ts
    └── plugin.json
```

## 代理（agents）

v1 便携契约只定义 skills 和 MCP servers；agents 与 commands、hooks、rules 一样属于厂商扩展。各 harness 通过带元信息（skills、mcps、tools）的专门工具加载和调度代理，技能内嵌 `agents/` 不会被加载为子代理。代理的声明与使用方式以各厂商文档为准。

## Canvas 组件

`canvases/` 是 Agent Plugins Spec 标准布局中的可选目录，用于交互式可视化界面。

**何时使用 Canvas**：

- 用户明确要求交互式 UI
- 插件产出需要可视化检视的报告、图表、仪表盘、日志摘要、设计契约、工作流状态

**何时不使用 Canvas**：

- 不做装饰性落地页或通用营销 UI
- 插件的核心价值不依赖可视化
- 没有用户主动要求时不主动创建

Canvas 是锦上添花的组件，不是默认输出。创建前确认用户确实需要可视化交互。

## 便携 vs 非便携组件

| 组件                   | 便携 v1 | 位置                      |
| ---------------------- | ------- | ------------------------- |
| 插件清单               | ✅      | `plugin.json`             |
| 技能                   | ✅      | `skills/<name>/SKILL.md`  |
| MCP 服务器             | ✅      | `mcp.json`                |
| 钩子                   | ❌      | 客户端 extension 或兼容包 |
| 代理 / persona         | ❌      | 客户端 extension 或兼容包 |
| 命令 / prompt          | ❌      | 客户端 extension 或兼容包 |
| LSP 服务器             | ❌      | 客户端 extension 或兼容包 |
| UI / 应用集成          | ❌      | 客户端 extension 或兼容包 |
| 市场条目 / 签名 / 发布 | ❌      | 平台发布流程              |

## 来源

- 规范全文：[Agent Plugins Spec 1.0.0](https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md)
- Schema 文件：`schemas/1.0.0/plugin.schema.json`、`schemas/1.0.0/mcp.schema.json`
