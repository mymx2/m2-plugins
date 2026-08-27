# Qoder: init.ts 编写指南

如何为 Qoder 插件编写 `init.ts` 适配脚本。Qoder 的 init 是这套多厂商架构的原始实现。

## NAMESPACE

```typescript
const NAMESPACE = '.qoder-plugin'
```

## 核心职责

```
读根 plugin.json → 提取 .qoder-plugin 扩展 → 合并 → 写 .qoder-plugin/plugin.json
```

## 参考实现（原始代码）

这是 `.qoder-plugin/init.ts` 的完整源码，它就是这个模式的原始实现：

```typescript
#!/usr/bin/env tsx
/**
 * Qoder 插件初始化脚本
 *
 * 将标准 Agent Plugins Spec 的 plugin.json 适配为 Qoder 格式。
 * 逻辑：标准字段为底，extensions['.qoder-plugin'] 数据覆盖上去，写入。
 *
 * 用法：
 *   tsx .qoder-plugin/init.ts [插件目录]
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const NAMESPACE = '.qoder-plugin'

export function init(pluginRoot: string): void {
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'plugin.json'), 'utf-8'))
  const ext = manifest.extensions?.[NAMESPACE]
  if (!ext) {
    console.error(`未找到 extensions['${NAMESPACE}']，跳过`)
    return
  }

  // 合并：标准字段打底，厂商字段覆盖
  const { extensions: _extensions, $schema: _$schema, ...base } = manifest
  const output = { ...base, ...ext }

  // 写入
  const outputDir = join(pluginRoot, NAMESPACE)
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, 'plugin.json'), JSON.stringify(output, null, 2) + '\n')
  console.log(`✓ ${NAMESPACE}/plugin.json 已生成`)
}

export default { init }

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  init(resolve(process.argv[2] ?? '.'))
}
```

### 代码走读

1. **读取**：从插件根加载 `plugin.json`，解析为对象。
2. **提取**：通过 `manifest.extensions?.[NAMESPACE]` 获取 Qoder 专属数据。不存在则跳过。
3. **合并**：解构剔除 `extensions` 和 `$schema`，剩余标准字段作为 base，Qoder 字段展开覆盖。
4. **写入**：创建 `.qoder-plugin/` 目录（如不存在），输出合并后的 `plugin.json`。
5. **扩展**：当前为空，预留给 Qoder 特有逻辑。

## Qoder 特有逻辑（可增长点）

### CONNECTORS.md 生成

如果 extensions 中声明了 MCP 服务器且需要凭证配置，init 可以自动生成 `CONNECTORS.md` 模板，列出需要配置的 token 和端点。

### rules/ 目录校验

扫描 `rules/` 目录，验证每个规则文件不超过 100,000 字符上限，且为纯自然语言（不含脚本或图片引用）。

### workflows/ 注册

如果 `workflows/` 目录存在，生成工作流注册索引。

### canvases/ 配置

如果插件声明了 Canvas 界面，生成 Canvas 注册文件。

### 组件路径一致性检查

验证 extensions 中声明的路径（`skills`、`rules`、`agents` 等）对应的目录实际存在。

## 用法

```bash
# 在插件根目录执行
tsx .qoder-plugin/init.ts .

# 或指定目录
tsx .qoder-plugin/init.ts /path/to/plugin
```

## 注意事项

- init.ts 必须幂等（重复运行结果一致）。
- 零第三方依赖，仅使用 Node 原生 API（`node:fs`、`node:path`）。
- 不修改根 `plugin.json`，只读不写。
- Qoder 的扩展字段最丰富（displayName、descriptionZh、category、tags 等），合并后 manifest 通常比其他厂商更"胖"。
