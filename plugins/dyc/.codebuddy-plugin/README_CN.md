# CodeBuddy 插件制作指南（dyc）

本目录是 dyc 插件的 CodeBuddy 适配层。官方依据：
[插件](https://www.codebuddy.cn/docs/cli/plugins) ·
[插件市场](https://www.codebuddy.cn/docs/cli/plugin-marketplaces) ·
[MCP](https://www.codebuddy.cn/docs/cli/mcp)

## 1. 目录结构与清单字段速查

```
plugins/dyc/
├── .codebuddy-plugin/
│   └── plugin.json      # 清单（本目录只放它，组件目录一律放插件根）
├── skills/<name>/SKILL.md
├── commands/  agents/  hooks/hooks.json   # 本插件未用到，有则自动加载
├── .mcp.json  .lsp.json  bin/  settings.json
```

`plugin.json` 字段（官方示例；仅 `author` 明确标注可选，`name` 为唯一标识与命名空间）：

| 字段                                                                       | 说明                                                              |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `name` / `version` / `description`                                         | 标识三件套；技能以 name 为前缀（`/dyc:think`）                    |
| `author` / `homepage` / `repository` / `license` / `keywords` / `category` | 元数据                                                            |
| `commands` / `agents` / `skills` / `hooks`                                 | 组件路径覆盖（官方示例值以 `./` 开头，如 `"./hooks/hooks.json"`） |
| `mcpServers`                                                               | string\|object（官方市场文档列为组件配置字段），路径或内联配置    |

## 2. 本插件的适配要点

- **`init.ts` 做了什么**：与 Claude 版同构——合并根 `plugin.json` 与 `extensions['.codebuddy-plugin']`（剔除 `extensions`/`$schema`/构建期字段 `init`）→ 写入本目录 → 跑 commands frontmatter、hooks 事件名、skills 深度 lint、`${CODEBUDDY_PLUGIN_ROOT}` 硬编码路径检查。
- **MCP 怎么配**：官方 MCP 文档明确 `type` 只支持 **`stdio` / `sse` / `http`**（可省略，按 `command`/`url` 自动推断），**不收 `streamable-http`**。因此 `init.ts` 把标准源 `mcp.json` 的 `streamable-http` 转为 `http` 后**内联**进 manifest（不落盘 `.mcp.json`，避免被 Claude 默认加载造成跨平台串扰——本仓库的取舍）。密钥写法 `headers: { "Authorization": "Bearer ${VAR}" }` 为官方支持（`${VAR}`、`${VAR:-default}` 均可用，仅全大写变量名会被展开；变量缺失时保留占位符并 WARNING，不报错）。
- **组件覆盖字段**：本插件不声明 `skills`——默认 `skills/` 目录即被扫描。

## 3. 本地开发 / 安装 / 校验

```bash
# 重新生成清单（根 init.ts 会自动调用各厂商 init，含本目录）
vp run init                      # 或 vpx tsx plugins/dyc/.codebuddy-plugin/init.ts plugins/dyc

# 本地开发加载（免安装，同名时优先于市场版）
codebuddy --plugin-dir ./plugins/dyc

# 会话内热重载 / 官方校验 / 调试
/reload-plugins
codebuddy plugin validate ./plugins/dyc
codebuddy --debug

# 本地市场方式（仓库根已带 .codebuddy-plugin/marketplace.json）
/plugin marketplace add ./
/plugin install dyc@m2-plugins

# 远程市场安装（正式发布路径）
/plugin marketplace add mymx2/m2-plugins
/plugin install dyc@m2-plugins
```

skill 调用：`/dyc:think`、`/dyc:check` ……（`/插件名:skill名` 命名空间，官方强制）。
