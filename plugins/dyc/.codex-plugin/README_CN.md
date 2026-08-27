# Codex 插件制作指南（dyc）

本目录是 dyc 插件的 Codex（OpenAI）适配层。官方依据：
[Package your plugin](https://developers.openai.com/plugins/build/plugins) ·
[Build plugins](https://learn.chatgpt.com/docs/build-plugins) ·
[Codex config reference（mcp_servers）](https://developers.openai.com/codex/config-reference)

## 1. 目录结构与清单字段速查

```
plugins/dyc/
├── .codex-plugin/
│   └── plugin.json      # 必需入口；官方明确此目录只放 plugin.json
├── skills/<name>/SKILL.md
├── hooks/hooks.json     # 默认钩子文件（存在即自动识别，无需声明）
├── assets/              # 图标/截图（本插件未用到）
├── .mcp.json            # 官方约定名（本插件刻意改用 mcp.codex.json，见第 2 节）
└── .app.json            # 已注册 MCP 连接映射（本插件未用到）
```

`plugin.json` 字段（官方：`plugin.json` 文件必需，字段均可选但发布插件通常写全）：

| 字段                                                          | 说明                                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `name` / `version` / `description`                            | 标识三件套；name 用 kebab-case，作命名空间                             |
| `author` / `homepage` / `repository` / `license` / `keywords` | 发布与发现元数据                                                       |
| `skills`                                                      | `"./skills/"`，指向捆绑技能目录                                        |
| `mcpServers`                                                  | `"./.mcp.json"`，指向 MCP 配置文件                                     |
| `apps`                                                        | `"./.app.json"`，仅用于已注册 MCP 连接映射（兼容字段）                 |
| `hooks`                                                       | 路径、路径数组、内联对象或对象数组；默认 `./hooks/hooks.json` 自动识别 |
| `interface`                                                   | 安装界面元数据（见下）                                                 |

路径规则（官方硬性要求）：**相对插件根、以 `./` 开头、不得越出插件根**。

`interface` 子字段：`displayName` / `shortDescription` / `longDescription` / `developerName` / `category` / `capabilities` / `websiteURL` / `privacyPolicyURL` / `termsOfServiceURL` / `defaultPrompt` / `brandColor` / `composerIcon` / `logo` / `screenshots`。

## 2. 本插件的适配要点

- **`init.ts` 做了什么**：合并生成清单（剔除 `extensions`/`$schema`/构建期字段 `init`）→ 校验 interface 必填项（displayName/shortDescription/category）、URL 格式、brandColor hex、assets 存在性、defaultPrompt → skills 深度 lint → 生成 `mcp.codex.json`。
- **MCP 怎么配（官方要点，已与旧版修正对齐）**：
  - manifest 的 `mcpServers` 指向一个 JSON 文件，文件内容是**直接 server 映射**或 **`mcp_servers` 包裹对象**（注意是蛇形 `mcp_servers`，不是 `mcpServers`）；
  - server 条目**没有 `type` 字段**：stdio 由 `command` 隐含，远程（streamable HTTP）由 `url` 隐含；
  - 远程鉴权用 `bearer_token_env_var`（值是环境变量名），静态头用 `http_headers`，从环境变量取头用 `env_http_headers`；不收 `headers` 写法。
  - 因此 `init.ts` 把标准源 `mcp.json` 的 `streamable-http + headers: Bearer ${VAR}` 转换为 `url + bearer_token_env_var` 并去掉全部 `type`。
- **为什么叫 `mcp.codex.json` 而不是 `.mcp.json`**：仓库根若出现 `.mcp.json` 会被 Claude Code 默认加载，造成跨平台串扰；自定义文件名由 manifest 显式指向，官方允许（本仓库的取舍，官方示例用 `.mcp.json`）。

## 3. 本地开发 / 安装 / 校验

```bash
# 重新生成清单 + mcp.codex.json
vp run init                      # 或 vpx tsx plugins/dyc/.codex-plugin/init.ts plugins/dyc

# 本地测试：官方推荐把插件目录加入本地 marketplace 后安装
# （在 ChatGPT Work 模式用 @plugin-creator，Codex 里用 $plugin-creator 辅助）
# Codex CLI 中打开插件浏览器安装：
codex
/plugins

# 从市场安装（本仓库 .agents/plugins/marketplace.json）
codex plugin marketplace add mymx2/m2-plugins
codex plugin add dyc@m2-plugins
```

skill 调用：Codex 用 `$` 前缀 mention（如 `$think`）；ChatGPT 用 `@` 前缀。
