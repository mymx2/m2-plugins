# Extensions + Init 模式

根 `plugin.json` 是唯一事实源；`init.ts` 是厂商适配生命周期钩子，不只是合并器。

## 架构总览

```text
plugin.json（标准字段 + extensions）
  extensions:
    .claude-plugin: { ... } ──→ .claude-plugin/init.ts ──→ .claude-plugin/plugin.json
    .qoder-plugin:  { ... } ──→ .qoder-plugin/init.ts  ──→ .qoder-plugin/plugin.json
    .codex-plugin:  { ... } ──→ .codex-plugin/init.ts  ──→ .codex-plugin/plugin.json
```

每个 `.<vendor>-plugin/` 目录都是 **衍生物**，从根 `plugin.json` 生成，不手动维护。

## 设计原则

1. **单一事实源**：根 `plugin.json` 的标准字段 + `extensions` 下的厂商字段，是全部信息的唯一来源。
2. **厂商隔离**：每个 `init.ts` 只读自己的 namespace，不碰其他厂商的数据。
3. **合并策略**：标准字段打底，厂商字段覆盖。`extensions` 和 `$schema` 从 base 中剔除。
4. **幂等性**：`init.ts` 多次执行结果一致，每次都从标准源重新生成。

## init.ts 标准模式

### 五步流程

1. 读取根 `plugin.json`
2. 提取 `extensions[NAMESPACE]`，不存在则跳过
3. 合并 → `{ ...base, ...ext }`（剔除 `extensions` 和 `$schema`）
4. 写入 `.<vendor>-plugin/plugin.json`
5. 执行厂商特有逻辑（可扩展阶段）

### 参考实现

以下是 `.qoder-plugin/init.ts` 的精简示意（完整源码与走读见 qoder 厂商目录的 init-guide），是三个厂商 init 中最简洁的基础实现。Claude 和 Codex 的 init 在此基础上增加了厂商特有校验（见各厂商 init-guide.md）：

```typescript
#!/usr/bin/env tsx
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const NAMESPACE = '.qoder-plugin'

export function init(pluginRoot: string): void {
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'plugin.json'), 'utf-8'))

  const ext = manifest.extensions?.[NAMESPACE]
  if (!ext) return

  const { extensions: _e, $schema: _s, ...base } = manifest
  const output = { ...base, ...ext }

  const outputDir = join(pluginRoot, NAMESPACE)
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, 'plugin.json'), JSON.stringify(output, null, 2) + '\n')

  // 第五步：厂商特有逻辑在此扩展
}

if (process.argv[1]?.endsWith('init.ts')) {
  init(resolve(process.argv[2] ?? '.'))
}
```

适配其他厂商只需改 `NAMESPACE` 常量，然后在第五步添加厂商特有逻辑。

## 合并规则

```
标准字段（name, version, description, author, homepage, repository, license, keywords）
    → 作为 base
extensions、$schema
    → 从 base 中剔除
extensions[NAMESPACE] 中的字段
    → 覆盖 base 同名键，补充 base 没有的新键
```

**示例**：标准 `name: "my-plugin"` + Qoder extensions `{ displayName: "My Plugin", category: "developer-tools" }` 合并后：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "My Plugin",
  "category": "developer-tools"
}
```

## 各厂商 extensions 字段约定

### .claude-plugin

```json
{ ".claude-plugin": { "init": ".claude-plugin/init.ts" } }
```

Claude Code 在 `extensions` 中的数据较少，大部分组件（commands、agents、hooks、skills）通过目录自动发现。init 的主要职责是合并 manifest + 处理路径变量 `${CLAUDE_PLUGIN_ROOT}` 相关逻辑。详见 `claude/manifest-rules.md` 和 `claude/init-guide.md`。

### .qoder-plugin

```json
{
  ".qoder-plugin": {
    "displayName": "dyc",
    "descriptionZh": "中文描述",
    "category": "developer-tools",
    "init": ".qoder-plugin/init.ts",
    "skills": "./skills/",
    "mcpServers": "./mcp.json"
  }
}
```

Qoder 的扩展字段最丰富：显示名、中文描述、分类、标签，以及显式声明各组件路径。详见 `qoder/manifest-rules.md` 和 `qoder/init-guide.md`。

### .codex-plugin

```json
{
  ".codex-plugin": {
    "init": ".codex-plugin/init.ts",
    "interface": {
      "displayName": "My Plugin",
      "category": "Developer Tools",
      "capabilities": ["Interactive", "Write"]
    }
  }
}
```

Codex 以 Marketplace 分发为导向，`interface` 对象承载展示元数据。详见 `codex/manifest-rules.md` 和 `codex/init-guide.md`。

## init.ts 生命周期演进

init.ts 不只是合并器。当前阶段做合并 manifest；未来可在第五步扩展厂商特有校验、文件生成、工具链注册、旧格式迁移等。**关键约束**：无论如何扩展，init.ts 必须保持幂等。

## 文件布局约定

```text
my-plugin/
├── plugin.json
├── skills/<skill>/SKILL.md
├── mcp.json                 # 可选
├── rules/                   # 可选
├── .claude-plugin/          # init 生成
│   ├── init.ts
│   └── plugin.json
├── .qoder-plugin/           # init 生成
│   ├── init.ts
│   └── plugin.json
└── .codex-plugin/           # init 生成
    ├── init.ts
    └── plugin.json
```

## extensions 在 plugin.json 中的位置

`extensions` 必须与标准字段同级：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "my-plugin",
  "extensions": {
    ".claude-plugin": { "init": ".claude-plugin/init.ts" },
    ".qoder-plugin": { "displayName": "My Plugin", "init": ".qoder-plugin/init.ts" },
    ".codex-plugin": { "init": ".codex-plugin/init.ts" }
  }
}
```

## Hard Rules

- 根 `plugin.json` 是唯一事实源，厂商目录下的 `plugin.json` 都是衍生物。
- `init.ts` 只读自己 namespace 的 extensions 数据。
- `init.ts` 必须幂等。
- 不在厂商目录中手动编辑 `plugin.json`，改动会被下次 init 覆盖。
- `extensions` 的 key 就是输出目录名（`.claude-plugin` → `.claude-plugin/`）。
- **不声明不存在的厂商组件**：extensions 中声明的路径对应的目录或文件必须实际存在。

厂商目录（`claude/`、`qoder/`、`codex/`）不受 validate-skill 引用完整性检查覆盖，重命名需全局 grep。

## Hooks 可移植性

hooks 是 Agent Plugins Spec 中明确标记为**非便携**的组件。每个厂商对 hooks 的实现方式不同：

| 厂商        | 格式               | 发现方式         |
| ----------- | ------------------ | ---------------- |
| Claude Code | `hooks/hooks.json` | 目录自动发现     |
| Qoder       | `hooks/hooks.json` | 目录自动发现     |
| Codex       | 无原生 hooks       | 通过 skills 实现 |

**可移植性策略**：

- 钩子逻辑尽量放在 `hooks/scripts/` 下的脚本中，各厂商的 `hooks.json` 仅做事件绑定。
- 不打包依赖特定运行时或本地绝对路径的 hooks。
- 如果某个厂商不支持 hooks（如 Codex），将等效逻辑作为 skill 或 command 提供。

## preserveUpstreamMetadata：保留用户手动改动

init.ts 每次从根 `plugin.json` 重新生成厂商目录，用户在 `.<vendor>-plugin/` 中的手动改动会被覆盖。

1. **首选：改根 plugin.json 的 extensions**。所有改动应回流到 `extensions[NAMESPACE]`。
2. **次选：override.json**。init.ts 第五步读取 `.<vendor>-plugin/override.json`（可选），合并进输出。override.json 本身不变化，幂等性不受影响。

## Gotchas

| 常见错误                                | 规则                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| 手动修改 `.<vendor>-plugin/plugin.json` | 改根 `plugin.json` 的 extensions，再跑 init                 |
| init 合并时忘了剔除 `$schema`           | base 中必须解构排除 `$schema` 和 `extensions`               |
| 两个厂商用同一个 extensions key         | 每个厂商必须独立 namespace                                  |
| init.ts 引入了第三方 npm 包             | init 脚本应零依赖，用 Node 原生 API                         |
| 厂商产物目录提交到了 git 但没有 init.ts | init.ts 必须提交；产物目录可选提交                          |
| init 后用户手动加的字段丢失了           | 改根 plugin.json 的 extensions，或用 override.json 机制保留 |
