# Qoder 插件制作指南（dyc）

本目录是 dyc 插件的 Qoder 适配层。官方依据：
[插件](https://docs.qoder.com/zh/cli/plugins) ·
[插件参考](https://docs.qoder.com/zh/cli/plugins-reference) ·
[MCP 参考](https://docs.qoder.com/zh/cli/mcp-reference)

## 1. 目录结构与清单字段速查

```
plugins/dyc/
├── .qoder-plugin/
│   └── plugin.json      # 推荐声明；省略时按目录名加载
├── commands/  agents/  skills/<name>/SKILL.md
├── hooks/hooks.json     # 注意：需 { "hooks": ... } 包裹格式
├── output-styles/  workflows/  bin/
├── .mcp.json            # 官方约定名
└── mcp.json             # 官方兼容：作为 .mcp.json 的回退（本插件用它）
```

`plugin.json` 字段（官方：**仅 `name` 必填**，其余全可选）：

| 字段                                                                                                                       | 说明                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `name`                                                                                                                     | 唯一标识，kebab-case，不含空格                       |
| `version` / `displayName` / `description` / `author` / `homepage` / `repository` / `license` / `keywords` / `dependencies` | 可选元信息                                           |
| `commands` / `agents` / `skills` / `outputStyles` / `workflowsPath`                                                        | 覆盖约定目录或内联声明（路径字符串、数组或对象映射） |
| `hooks` / `mcpServers`                                                                                                     | 相对路径 JSON 文件或内联配置                         |
| `userConfig` / `settings`                                                                                                  | 用户可配置项；settings 目前仅支持 `agent` 键         |

## 2. 本插件的适配要点

- **`init.ts` 做了什么**：最简合并器——读根 `plugin.json`，剔除 `extensions`/`$schema`/构建期字段 `init`，用 `extensions['.qoder-plugin']` 覆盖合并后写入本目录。Qoder 官方直接兼容 `streamable-http`，所以**不做 MCP 转换**，manifest 的 `mcpServers` 直接指向标准源 `./mcp.json`。
- **保留的非官方字段**（本仓库有意为之，Qoder 忽略未知字段）：`displayName`、`descriptionZh`、`category`、`tags`、`rules`、`preserveUpstreamMetadata`。其中 `rules/` 目录是本仓库自有的规则文件，Qoder 没有 rules 路径覆盖机制，随插件目录一起分发即可。
- **MCP 官方取值**：`type` 支持 `stdio`（默认）/`sse`/`http`/`streamable-http`/`ws`/`sdk`；远程用 `url` + `headers`。标准源 `mcp.json` 的 `streamable-http + headers: Bearer ${VAR}` 写法 Qoder 原生可收。
- **`install.ts`（本仓库自建的本地安装器，`vp run qoder:dyc`）**：把插件复制到 `~/.qoder` 与 `~/.qoder-cn`（哪个存在装哪个）的 custom 插件目录；旧版备份为 `.dyc.bak`、失败自动回滚、注册进 `installed_plugins_v2.json`（key 为 `dyc@local-custom`）。复制清单**刻意排除** `.claude-plugin/`、`.codebuddy-plugin/`、`.codex-plugin/` 与 `mcp.codex.json`（其他厂商的适配产物不进 Qoder 安装包）。

## 3. 本地开发 / 安装 / 校验

```bash
# 重新生成清单
vp run init                      # 或 vpx tsx plugins/dyc/.qoder-plugin/init.ts plugins/dyc

# 官方校验（列出发现的组件；CLI 二进制名为 qodercli）
qodercli plugins validate ./plugins/dyc

# 方式一：官方命令从本地目录安装
qodercli plugins install ./plugins/dyc      # 加 --scope project 装到项目级
# 然后在 TUI 里 /plugins reload 或重启 CLI

# 方式二：本仓库脚本双端复制安装（支持国际版 + CN 版）
vp run qoder:dyc

# 从市场安装
qodercli plugins marketplace add mymx2/m2-plugins
qodercli plugins install dyc

# 管理
qodercli plugins list / uninstall dyc / enable dyc / disable dyc
```
