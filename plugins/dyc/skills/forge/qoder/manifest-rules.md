# Qoder: .qoder-plugin/ 约定

Qoder 插件的 manifest 和组件组织速查卡。

## 清单文件

| 属性     | 值                                  |
| -------- | ----------------------------------- |
| 位置     | `.qoder-plugin/plugin.json`         |
| 路径变量 | 无专用路径变量（使用相对路径 `./`） |

## extensions 字段

在根 `plugin.json` 中声明：

```json
{
  "extensions": {
    ".qoder-plugin": {
      "displayName": "my-plugin",
      "descriptionZh": "中文描述",
      "category": "developer-tools",
      "tags": ["tag1", "tag2"],
      "init": ".qoder-plugin/init.ts",
      "mcpServers": "./mcp.json",
      "skills": "./skills/",
      "rules": "./rules/",
      "agents": "./agents/",
      "workflows": "./workflows/",
      "commands": "./commands/"
    }
  }
}
```

## 扩展字段速查

| 字段            | 类型     | 说明                         |
| --------------- | -------- | ---------------------------- |
| `displayName`   | string   | 显示名称（用户可见）         |
| `descriptionZh` | string   | 中文描述                     |
| `category`      | string   | 分类（如 `developer-tools`） |
| `tags`          | string[] | 标签                         |
| `init`          | string   | init.ts 脚本路径             |
| `skills`        | string   | 技能目录路径                 |
| `mcpServers`    | string   | MCP 配置路径                 |
| `rules`         | string   | 规则目录路径                 |
| `agents`        | string   | Agent 目录路径               |
| `workflows`     | string   | 工作流目录路径               |
| `commands`      | string   | 命令目录路径                 |

## 组件目录

| 目录/文件          | 组件类型   | 说明                                             |
| ------------------ | ---------- | ------------------------------------------------ |
| `skills/`          | 技能       | 子目录含 `SKILL.md`（标准组件）                  |
| `rules/`           | 规则       | 项目标准、编码规范、文件约束                     |
| `agents/`          | 子 Agent   | `.md` 文件，可声明 tools/model/skills/mcpServers |
| `commands/`        | 命令       | `.md` 文件，Agent 可执行的命令                   |
| `hooks/hooks.json` | 钩子       | 确定性生命周期自动化                             |
| `mcp.json`         | MCP 服务器 | 标准组件，STDIO 和 SSE/Streamable HTTP           |
| `canvases/`        | Canvas     | 交互式 UI 界面（可选）                           |
| `workflows/`       | 工作流     | 工作流定义（可选）                               |
| `CONNECTORS.md`    | 连接器配置 | token/账号/端点的设置说明                        |

## Skills

推荐 frontmatter：

```yaml
---
name: <skill-name>
version: 1.0.0
description: What this skill does in English
description_zh: 这个技能做什么的中文描述
user-invocable: true
argument-hint: <expected input>
---
```

参考：https://docs.qoder.com/user-guide/skills

## Rules

- 存放在 `rules/` 目录
- 自然语言描述，不含脚本/图片
- 优先于 `AGENTS.md`

参考：https://docs.qoder.com/user-guide/rules

## 厂商约束（字数/行数限制）

| 组件        | 字段/属性                 | 上限         | 说明                         |
| ----------- | ------------------------- | ------------ | ---------------------------- |
| rules/*.md  | 活跃内容                  | 100,000 字符 | 平台硬性限制                 |
| SKILL.md    | `description` frontmatter | 1,024 字符   | 注入 system prompt，必须精炼 |
| plugin.json | `description`             | 2,000 字符   | 插件总体描述                 |
| plugin.json | `displayName`             | 50 字符      | 用户可见名称                 |
| plugin.json | `descriptionZh`           | 500 字符     | 中文描述                     |
| plugin.json | `name`                    | 1–64 字符    | a-z + 0-9 + `-` + `.`        |

> **原则**：Qoder 扩展字段最丰富，约束主要来自平台限制和展示需求。rules 的 100,000 字符上限是平台硬性限制。

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

## Agents

`.md` 文件，frontmatter 可含 `name`、`description`、`tools`、`model`、`skills`、`mcpServers`。

### agents 打包指导

Qoder 的 subagent 功能比 Claude Code 更丰富，可声明工具集、模型、关联技能。

- **何时用 agent**：当插件需要一个专门的子代理执行特定子任务（如代码审查、测试生成、文档编写）时。
- **何时提升为 skill**：当该能力是用户主动调用的独立工作流时。
- **frontmatter 推荐字段**：
  - `name`：子代理名称
  - `description`：角色描述
  - `tools`：可用工具列表（如 `["Read", "Write", "Grep"]`）
  - `skills`：关联的技能列表
  - `mcpServers`：关联的 MCP 服务器
- **不打包无工具的 agent**：如果 agent 不需要任何工具，考虑将逻辑合并到 skill 中。

参考：https://docs.qoder.com/extensions/subagent

## Hooks

`hooks/hooks.json`，脚本通过 exit code 通信：

- `0`：允许/继续
- `2`：阻止（当事件可阻止时）
- 其他：非阻止性错误

参考：https://docs.qoder.com/extensions/hooks

## MCP

Qoder 支持 STDIO 和 SSE/Streamable HTTP。凭证放在 `CONNECTORS.md` 的设置说明中，不写入 `mcp.json`。

参考：https://docs.qoder.com/user-guide/chat/model-context-protocol

## 典型目录结构

```text
my-plugin/
├── plugin.json                  # 标准根 manifest
├── .qoder-plugin/
│   ├── init.ts
│   └── plugin.json              # init 生成的 Qoder manifest
├── skills/
│   └── greet/SKILL.md
├── rules/
│   └── coding-standards.md
├── agents/
│   └── code-reviewer.md
├── commands/
│   └── deploy.md
├── hooks/
│   └── hooks.json
├── mcp.json
├── CONNECTORS.md
└── README.md
```
