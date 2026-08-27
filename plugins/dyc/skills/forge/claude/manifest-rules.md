# Claude Code: .claude-plugin/ 约定

Claude Code 插件的 manifest 和组件组织速查卡。基于 `vendor/anthropics/claude-plugins-official/plugins/plugin-dev/` 蒸馏。

## 清单文件

| 属性     | 值                                              |
| -------- | ----------------------------------------------- |
| 位置     | `.claude-plugin/plugin.json`                    |
| 路径变量 | `${CLAUDE_PLUGIN_ROOT}`（插件根目录的绝对路径） |

## extensions 字段

在根 `plugin.json` 中声明：

```json
{
  "extensions": {
    ".claude-plugin": {
      "init": ".claude-plugin/init.ts"
    }
  }
}
```

Claude Code 在 `extensions` 中的数据通常较少——大部分组件通过目录自动发现，不需要在 manifest 中显式声明路径。

## 组件目录

Claude Code 自动扫描以下根级目录，缺失不报错：

| 目录/文件          | 组件类型   | 格式                         |
| ------------------ | ---------- | ---------------------------- |
| `commands/`        | 斜杠命令   | `.md` 文件，YAML frontmatter |
| `agents/`          | 子 Agent   | `.md` 文件，YAML frontmatter |
| `skills/`          | 技能       | 子目录含 `SKILL.md`          |
| `hooks/hooks.json` | 事件钩子   | JSON 配置                    |
| `.mcp.json`        | MCP 服务器 | JSON 配置                    |
| `scripts/`         | 辅助脚本   | 任意可执行文件               |

### commands/ 示例

```markdown
---
name: review-pr
description: Review a pull request for quality and security
---

Review instructions...
```

文件名为命令名：`commands/review-pr.md` → `/review-pr`。

### agents/ 示例

```markdown
---
description: Code review specialist
capabilities:
  - Analyze code quality
  - Detect security issues
---

Agent instructions and knowledge...
```

### agents 打包指导

Claude Code 通过 `agents/` 目录自动发现子 Agent。打包时注意：

- **何时用 agent**：当插件需要一个内部助手（如代码审查专家、文档生成器）来支持主 skill 时。
- **何时提升为 skill**：当该能力本身是用户会主动调用的独立工作流时，应作为 skill 而非 agent。
- **frontmatter 字段**：`description` 必填（上限 1,000 字符），`capabilities` 可选但建议填写。
- **不打包依赖特定环境的 agent**：如果 agent 依赖特定本地路径或外部服务，应在 description 中说明前置条件。

### hooks/hooks.json 示例

```json
{
  "PreToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate.sh",
          "timeout": 30
        }
      ]
    }
  ]
}
```

可用事件：`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStop`、`SessionStart`、`SessionEnd`、`UserPromptSubmit`、`PreCompact`、`Notification`。

### .mcp.json 示例

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/servers/server.js"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

## 路径变量 ${CLAUDE_PLUGIN_ROOT}

用于所有插件内路径引用：

```json
{ "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/run.sh" }
```

- hooks 命令路径
- MCP server 参数
- 脚本执行引用
- 资源文件路径

**禁止使用**：硬编码绝对路径、工作目录相对路径、`~` 家目录。

## 厂商约束（字数/行数限制）

| 组件             | 字段/属性                 | 上限       | 说明                         |
| ---------------- | ------------------------- | ---------- | ---------------------------- |
| SKILL.md         | `description` frontmatter | 1,024 字符 | 注入 system prompt，必须精炼 |
| commands/*.md    | `description` frontmatter | 500 字符   | 命令列表页展示               |
| agents/*.md      | `description` frontmatter | 1,000 字符 | Agent 角色描述               |
| hooks/hooks.json | `timeout`                 | 300 秒     | 单个钩子最大执行时间         |
| plugin.json      | `description`             | 2,000 字符 | 插件总体描述                 |
| plugin.json      | `name`                    | 1–64 字符  | a-z + 0-9 + `-` + `.`        |

> **原则**：Claude Code 大部分组件通过目录自动发现，manifest 字段较少。约束主要来自实际路由和展示需求，而非平台硬性限制。

## Skill 编写规则（来自 addyosmani/agent-skills 实践）

此表与三个厂商目录的 manifest-rules 同步，改动需三处一起。

| 规则                         | 类型 | 说明                                                                        |
| ---------------------------- | ---- | --------------------------------------------------------------------------- |
| description 含 "Use when..." | 错误 | 必须说明何时触发，否定形式不算                                              |
| name 与目录名一致            | 错误 | frontmatter `name` 必须等于目录名                                           |
| 目录名 kebab-case            | 错误 | `lowercase-hyphen-separated`                                                |
| 推荐 section 完整            | 警告 | Overview / When to Use / Common Rationalizations / Red Flags / Verification |
| 跨技能引用无死链             | 警告 | `use the \`xxx\` skill` 必须指向已知技能                                    |
| references/ 链接可解析       | 警告 | 共享引用用 `../../references/`，技能内用 `references/`                      |
| SKILL.md ≤ 500 行            | 警告 | 超过则拆到 references/                                                      |
| 支撑文件按需创建             | 建议 | 超过 100 行的参考资料拆成独立文件                                           |

## 自动发现机制

1. 读取 `.claude-plugin/plugin.json`
2. 扫描 `commands/` 中的 `.md` 文件
3. 扫描 `agents/` 中的 `.md` 文件
4. 扫描 `skills/` 中含 `SKILL.md` 的子目录
5. 加载 `hooks/hooks.json` 或 manifest 中的 hooks 配置
6. 加载 `.mcp.json` 或 manifest 中的 MCP 配置

**自定义路径**：`plugin.json` 中声明的路径**补充**（不替换）默认目录。

## 典型目录结构

```text
my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── review.md
├── agents/
│   └── code-reviewer.md
├── skills/
│   └── api-testing/
│       └── SKILL.md
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       └── validate.sh
├── .mcp.json
└── scripts/
    └── helper.py
```
