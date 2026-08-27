# Claude Code: init.ts 编写指南

如何为 Claude Code 插件编写 `init.ts` 适配脚本。基于 `.claude-plugin/init.ts` 真实实现。

## NAMESPACE

```typescript
const NAMESPACE = '.claude-plugin'
```

## 核心职责

```
读根 plugin.json → 提取 .claude-plugin 扩展 → 合并 → 写 .claude-plugin/plugin.json → Claude 特有校验
```

## 参考实现

当前 `.claude-plugin/init.ts` 已实现以下功能：

### 基础合并（与 Qoder 相同的 5 步）

1. 读取根 `plugin.json`
2. 提取 `extensions['.claude-plugin']`
3. 合并：`{ ...base, ...ext }`（剔除 `extensions` 和 `$schema`）
4. 写入 `.claude-plugin/plugin.json`
5. Claude 特有校验（见下）

### Claude 特有校验（第五步，已实现）

| 校验函数           | 说明                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `validateCommands` | 扫描 `commands/` 每个 `.md` 文件的 frontmatter 是否含 `description`         |
| `validateHooks`    | 验证 `hooks/hooks.json` 事件名是否为 9 个已知事件之一                       |
| `validateSkills`   | 扫描 `skills/` 目录，校验 `SKILL.md` 存在性与 description 长度 ≤ 1,024 字符 |
| `validateMcpPaths` | 检查 `.mcp.json` 中是否有硬编码绝对路径（应用 `${CLAUDE_PLUGIN_ROOT}`）     |

已知钩子事件：`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStop`、`SessionStart`、`SessionEnd`、`UserPromptSubmit`、`PreCompact`、`Notification`。

### 辅助工具函数

- `extractFrontmatter(content)`：从 Markdown 文件头部提取 YAML frontmatter 字段
- `listMarkdownFiles(dir)`：列出目录中所有 `.md` 文件
- `warn(msg)`：非致命警告输出

## Claude 特有逻辑（可增长点）

当前已实现基础校验。以下是未来可扩展的方向：

### 生成 agents/ 索引

如果 `agents/` 目录非空，可以在 `.claude-plugin/` 下生成一个 agents 索引文件，方便调试。

### marketplace.json 提示

检测 `.claude-plugin/marketplace.json` 是否存在，若缺失则提示用户考虑创建（用于 Claude Code Marketplace 分发）。

### commands/ 格式兼容

Claude Code 社区同时存在 `.md` frontmatter 格式和 `.toml` 格式的 commands。init 可以同时扫描两种格式并报告发现的命令数量。

## 用法

```bash
# 在插件根目录执行
tsx .claude-plugin/init.ts .

# 或指定目录
tsx .claude-plugin/init.ts /path/to/plugin
```

## 注意事项

- init.ts 必须幂等（重复运行结果一致）。
- 零第三方依赖，仅使用 Node 原生 API（`node:fs`、`node:path`）。
- 不修改根 `plugin.json`，只读不写。
- Claude Code 的 manifest 字段通常比 Qoder 少，因为大部分组件通过目录自动发现。
