# CodeBuddy: .codebuddy-plugin/ 约定

CodeBuddy 插件的 manifest 和组件组织速查卡。官方文档：[插件](https://www.codebuddy.cn/docs/cli/plugins) · [插件市场](https://www.codebuddy.cn/docs/cli/plugin-marketplaces) · [MCP](https://www.codebuddy.cn/docs/cli/mcp)。

## 清单文件

| 属性     | 值                              |
| -------- | ------------------------------- |
| 位置     | `.codebuddy-plugin/plugin.json` |
| 路径变量 | `${CODEBUDDY_PLUGIN_ROOT}`      |

## extensions 字段

在根 `plugin.json` 中声明：

```json
{
  "extensions": {
    ".codebuddy-plugin": {
      "init": ".codebuddy-plugin/init.ts"
    }
  }
}
```

`init` 是构建期约定（指向本脚本），不是 CodeBuddy 清单字段；init 生成产物时会剔除它。组件目录默认按约定扫描，只有需要覆盖路径时才额外声明（如 `"skills": "./skills/"`、`"hooks": "./hooks/hooks.json"`）。

## 清单字段速查

| 字段                                                          | 说明                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| `name` / `version` / `description`                            | 标识三件套；`name` 是命名空间，技能调用为 `/插件名:技能名` |
| `author` / `homepage` / `repository` / `license` / `keywords` | 元数据，`author` 可选                                      |
| `category`                                                    | 分类                                                       |
| `commands` / `agents` / `skills` / `hooks`                    | 组件路径覆盖（官方示例值以 `./` 开头）                     |
| `mcpServers`                                                  | string 或 object：路径或内联配置                           |

## MCP 约束

`type` 仅支持 **`stdio` / `sse` / `http`**（可省略，按 `command`/`url` 推断），**不接受 `streamable-http`**。init 会把标准源 `mcp.json` 中的 `streamable-http` 转为 `http` 后内联进 manifest。凭据写法 `headers: { "Authorization": "Bearer ${VAR}" }` 为官方支持；本插件便携 `mcp.json` 不写凭据，鉴权在 CodeBuddy 的 MCP 设置里完成。

## 组件目录

| 目录/文件                | 组件类型     | 说明                                      |
| ------------------------ | ------------ | ----------------------------------------- |
| `skills/`                | 技能         | 子目录含 `SKILL.md`，默认扫描             |
| `commands/`              | 命令         | `.md`，frontmatter 需含 `description`     |
| `agents/`                | 子 Agent     | `.md` 文件                                |
| `hooks/hooks.json`       | 钩子         | 事件名与 Claude Code 同构                 |
| `.mcp.json`              | MCP 服务器   | 路径引用应使用 `${CODEBUDDY_PLUGIN_ROOT}` |
| `.lsp.json`              | LSP          | 语言服务器配置                            |
| `bin/` / `settings.json` | 可执行与设置 | 可选                                      |

## 厂商约束（字数/行数限制）

| 组件        | 字段/属性                 | 上限       | 说明                         |
| ----------- | ------------------------- | ---------- | ---------------------------- |
| SKILL.md    | `description` frontmatter | 1,024 字符 | 注入 system prompt，必须精炼 |
| plugin.json | `description`             | 2,000 字符 | 插件总体描述                 |
| plugin.json | `name`                    | 1–64 字符  | a-z + 0-9 + `-` + `.`        |

## Skill 编写规则

此表与其他厂商目录的 manifest-rules 同步，改动需各厂商目录一起。

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

## 典型目录结构

```text
my-plugin/
├── plugin.json                  # 标准根 manifest
├── .codebuddy-plugin/
│   ├── init.ts
│   └── plugin.json              # init 生成的 CodeBuddy manifest
├── skills/
│   └── greet/SKILL.md
├── commands/                    # 可选
├── agents/                      # 可选
├── hooks/hooks.json             # 可选
└── mcp.json                     # 可选，init 内联进 manifest
```

## 安装与校验

```bash
codebuddy --plugin-dir ./plugins/dyc     # 本地开发加载
codebuddy plugin validate ./plugins/dyc  # 官方校验
/plugin marketplace add ./               # 本地市场
/plugin install dyc@m2-plugins
```
