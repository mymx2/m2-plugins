# Codex (OpenAI): init.ts 编写指南

如何为 Codex 插件编写 `init.ts` 适配脚本。基于 `.codex-plugin/init.ts` 真实实现。

## NAMESPACE

```typescript
const NAMESPACE = '.codex-plugin'
```

## 核心职责

```
读根 plugin.json → 提取 .codex-plugin 扩展 → 合并 → 写 .codex-plugin/plugin.json → Codex 特有校验
```

## 参考实现

当前 `.codex-plugin/init.ts` 已实现以下功能：

### 基础合并（与 Qoder 相同的 5 步）

1. 读取根 `plugin.json`
2. 提取 `extensions['.codex-plugin']`
3. 合并：`{ ...base, ...ext }`（剔除 `extensions` 和 `$schema`）
4. 写入 `.codex-plugin/plugin.json`
5. Codex 特有校验（见下）

### Codex 特有校验（第五步，已实现）

| 校验函数            | 说明                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validateInterface` | 校验 `interface` 必填字段（displayName, shortDescription, category）；URL 格式；brandColor hex 格式；shortDescription ≤ 200 字符；defaultPrompt 为非空字符串数组 |
| `validateAssets`    | 检查 `interface.logo`、`interface.composerIcon`、`interface.screenshots` 引用的文件是否存在                                                                      |
| `validateSkills`    | 扫描 `skills/` 目录，校验 `SKILL.md` 存在性与 description 长度 ≤ 1,024 字符                                                                                      |
| `validateApp`       | 如果声明了 `apps` 字段，验证 `.app.json` 存在且 JSON 合法                                                                                                        |

### 辅助工具函数

- `isValidUrl(s)`：URL 格式校验
- `isValidHex(s)`：hex 颜色校验（`#RGB` 或 `#RRGGBB`）
- `extractFrontmatter(content)`：从 Markdown 文件头部提取 YAML frontmatter 字段
- `warn(msg)`：非致命警告输出

## Codex 特有逻辑（可增长点）

当前已实现基础校验。以下是未来可扩展的方向：

### capabilities 枚举校验

验证 `interface.capabilities` 中的值是否为已知标签（`Interactive`、`Read`、`Write`）。

### Marketplace 分类建议

根据 `interface.category` 提供 Marketplace 热门分类建议。

### .agents/plugins/marketplace.json 生成

Waza 项目展示了 `.agents/plugins/marketplace.json` 模式（Codex 仓库级 marketplace）。init 可以从根 plugin.json 自动生成此文件。

### 与上游 Codex 规范对齐

参考 `vendor/openai/plugins/plugins/` 中的实际插件（如 vercel、build-ios-apps），定期更新 `interface` 字段校验规则。

## 用法

```bash
# 在插件根目录执行
tsx .codex-plugin/init.ts .

# 或指定目录
tsx .codex-plugin/init.ts /path/to/plugin
```

## 注意事项

- init.ts 必须幂等（重复运行结果一致）。
- 零第三方依赖，仅使用 Node 原生 API（`node:fs`、`node:path`）。
- 不修改根 `plugin.json`，只读不写。
- Codex 的 `interface` 对象是最独特的部分，init 的扩展逻辑主要围绕 Marketplace 元数据的验证和补全。
- `shortDescription` 的 200 字符上限是平台硬性限制，init 会主动警告超标。
