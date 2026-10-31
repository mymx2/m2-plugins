# CodeBuddy: init.ts 编写指南

如何为 CodeBuddy 插件编写 `init.ts` 适配脚本。基于 `.codebuddy-plugin/init.ts` 真实实现。

## NAMESPACE

```typescript
const NAMESPACE = '.codebuddy-plugin'
```

## 核心职责

```
读根 plugin.json → 提取 .codebuddy-plugin 扩展 → 合并 → MCP 适配内联 → 写 .codebuddy-plugin/plugin.json → CodeBuddy 特有校验
```

## 参考实现

当前 `.codebuddy-plugin/init.ts` 已实现以下功能：

### 基础合并

1. 读取根 `plugin.json`
2. 提取 `extensions['.codebuddy-plugin']`
3. 合并：`{ ...base, ...ext }`，剔除 `extensions`、`$schema` 和构建期字段 `init`
4. 写入 `.codebuddy-plugin/plugin.json`
5. CodeBuddy 特有校验（见下）

### MCP 适配（第四步前）

根 `mcp.json` 存在时，把 `streamable-http` 类型的 server 转为 `http`，然后内联进生成 manifest 的 `mcpServers`。CodeBuddy 只认 `stdio` / `sse` / `http`；`headers` + `${VAR}` 写法原样保留。

### CodeBuddy 特有校验（第五步）

| 校验函数           | 说明                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validateCommands` | 扫描 `commands/`，每个 `.md` 的 frontmatter 必须有 `description`                                                                                                            |
| `validateHooks`    | 读取 `hooks/hooks.json`，事件名不在白名单内则警告；白名单与 `schemas/claude-code-plugin-manifest.schema.json` 保持同步                                                      |
| `validateSkills`   | 扫描 `skills/`（跳过 `*-workspace/` 评测产物），用 `scripts/lib/skill-lint.ts` 做深度校验：description 上限、触发词、name-目录匹配、必需 section、死链、references 链接解析 |
| `validateMcpPaths` | 读取 `.mcp.json`，出现 `/Users`、`/home`、`/usr`、`/opt` 等硬编码绝对路径时警告改用 `${CODEBUDDY_PLUGIN_ROOT}`                                                              |

### Hooks 事件白名单

CodeBuddy 的 hook 事件与 Claude Code 同构，当前白名单 29 个事件（`PreToolUse`、`PostToolUse`、`SessionStart`、`SessionEnd`、`Stop` 等）。新增事件时先更新 `schemas/claude-code-plugin-manifest.schema.json`，再同步 `VALID_HOOK_EVENTS`。

## 用法

```bash
# 在插件根目录执行
tsx .codebuddy-plugin/init.ts .

# 或指定目录
tsx .codebuddy-plugin/init.ts /path/to/plugin
```

## 注意事项

- init.ts 必须幂等（重复运行结果一致）。
- 零第三方依赖，仅使用 Node 原生 API（`node:fs`、`node:path`）与插件内共享的 `scripts/lib/skill-lint.ts`。
- 不修改根 `plugin.json`，只读不写。
- 生成 manifest 时不落盘 `.mcp.json`：内联进 manifest 可避免宿主默认加载时与其他厂商配置串扰（本仓库的取舍）。
- CodeBuddy 用 `/插件名:技能名` 命名空间调用技能，`name` 字段即命名空间，改名会影响调用方式。
