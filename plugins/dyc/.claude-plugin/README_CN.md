# Claude Code 插件制作指南（dyc）

本目录是 dyc 插件的 Claude Code 适配层。官方依据：
[Plugins](https://code.claude.com/docs/zh-CN/plugins) ·
[Plugin Marketplaces](https://code.claude.com/docs/zh-CN/plugin-marketplaces) ·
[Plugins Reference](https://code.claude.com/docs/zh-CN/plugins-reference)

## 1. 目录结构与清单字段速查

```
plugins/dyc/
├── .claude-plugin/
│   └── plugin.json      # 清单（本目录只放它，组件目录一律放插件根）
├── skills/<name>/SKILL.md
├── commands/  agents/  hooks/hooks.json   # 本插件未用到，有则自动加载
└── .mcp.json            # 本插件刻意不用（见第 2 节）
```

`plugin.json` 字段（官方：仅 `name` 必填，清单本身都可省略）：

| 字段                                                                                      | 说明                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `name`                                                                                    | 唯一标识（kebab-case），同时是 skill 命名空间前缀 |
| `version` / `description` / `author` / `homepage` / `repository` / `license` / `keywords` | 均可选元数据                                      |
| `skills`                                                                                  | string\|array，追加到默认 `skills/` 扫描          |
| `commands` / `agents`                                                                     | string\|array，**替换**默认目录                   |
| `hooks` / `mcpServers` / `lspServers`                                                     | string\|array\|object，路径或内联配置             |

路径规则（官方硬性要求）：**所有路径相对插件根、以 `./` 开头**。未识别字段会被忽略，但 `claude plugin validate` 会告警。

## 2. 本插件的适配要点

- **`init.ts` 做了什么**：读根 `plugin.json` → 剔除 `extensions`/`$schema` → 用 `extensions['.claude-plugin']` 覆盖合并 → 剔除构建期字段 `init`（非官方字段，避免 validate 告警）→ 写入本目录 `plugin.json`。随后跑 4 项校验：commands frontmatter、hooks 事件名白名单、skills 深度 lint、`${CLAUDE_PLUGIN_ROOT}` 硬编码路径检查。
- **MCP 怎么配**：Claude 官方支持 `.mcp.json` 独立文件**或** manifest 内联 `mcpServers` 对象。本插件选内联，避免落盘 `.mcp.json`（根目录已有标准源 `mcp.json`，再放 `.mcp.json` 会被 Claude 默认加载造成重复）。`init.ts` 把标准源的 `streamable-http` 转为 `http`（Claude 占位符解析表只认 stdio/http/sse/ws 四类）后内联；`headers` 里的 `Bearer ${VAR}` 写法原样保留。
- **组件覆盖字段**：本插件没用 `skills` 字段——默认 `skills/` 目录就会被扫描，无需声明。

## 3. 本地开发 / 安装 / 校验

```bash
# 重新生成清单（改根 plugin.json 或 mcp.json 后必跑）
vp run init                      # 或 vpx tsx plugins/dyc/.claude-plugin/init.ts plugins/dyc

# 本地开发加载（免安装，同名时优先于市场版）
claude --plugin-dir ./plugins/dyc

# 会话内热重载
/reload-plugins

# 官方校验
claude plugin validate ./plugins/dyc

# 从市场安装（正式发布路径）
/plugin marketplace add mymx2/m2-plugins
/plugin install dyc@m2-plugins
```

skill 调用：`/dyc:think`、`/dyc:check` ……（`/插件名:skill名` 命名空间，官方强制）。
