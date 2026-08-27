# Codex (OpenAI): .codex-plugin/ 约定

Codex 插件的 manifest 和组件组织速查卡。Codex 以 Marketplace 分发为导向，强调 `interface` 展示元数据。基于 `vendor/openai/plugins/plugins/` 蒸馏。

## 清单文件

| 属性     | 值                          |
| -------- | --------------------------- |
| 位置     | `.codex-plugin/plugin.json` |
| 路径变量 | 无专用路径变量              |

## extensions 字段

在根 `plugin.json` 中声明：

```json
{
  "extensions": {
    ".codex-plugin": {
      "init": ".codex-plugin/init.ts",
      "interface": {
        "displayName": "My Plugin",
        "shortDescription": "Build and deploy web apps",
        "longDescription": "...",
        "developerName": "Developer Name",
        "category": "Developer Tools",
        "capabilities": ["Interactive", "Write"],
        "websiteURL": "https://example.com",
        "privacyPolicyURL": "https://example.com/privacy",
        "termsOfServiceURL": "https://example.com/terms",
        "defaultPrompt": ["What can this plugin do?"],
        "composerIcon": "./assets/logo.png",
        "logo": "./assets/logo.png",
        "screenshots": [],
        "brandColor": "#000000"
      }
    }
  }
}
```

## 扩展字段速查

### 顶层字段

| 字段        | 类型   | 说明                             |
| ----------- | ------ | -------------------------------- |
| `init`      | string | init.ts 脚本路径                 |
| `skills`    | string | 技能目录路径                     |
| `apps`      | string | 应用定义路径（如 `./.app.json`） |
| `interface` | object | Marketplace 展示元数据（见下）   |

### interface 对象

| 字段                | 类型     | 说明                                  |
| ------------------- | -------- | ------------------------------------- |
| `displayName`       | string   | Marketplace 显示名                    |
| `shortDescription`  | string   | 简短描述（列表页）                    |
| `longDescription`   | string   | 详细描述（详情页）                    |
| `developerName`     | string   | 开发者名称                            |
| `category`          | string   | 分类                                  |
| `capabilities`      | string[] | 能力标签（如 `Interactive`、`Write`） |
| `websiteURL`        | string   | 官网链接                              |
| `privacyPolicyURL`  | string   | 隐私政策链接                          |
| `termsOfServiceURL` | string   | 服务条款链接                          |
| `defaultPrompt`     | string[] | 默认提示语（引导用户）                |
| `composerIcon`      | string   | 图标路径                              |
| `logo`              | string   | Logo 路径                             |
| `screenshots`       | string[] | 截图路径列表                          |
| `brandColor`        | string   | 品牌色（hex）                         |

## 组件目录

| 目录/文件   | 组件类型 | 说明                            |
| ----------- | -------- | ------------------------------- |
| `skills/`   | 技能     | 子目录含 `SKILL.md`（标准组件） |
| `.app.json` | 应用定义 | Codex App 配置（可选）          |

Codex 的组件类型相对简洁，主要通过 `skills/` 提供技能，通过 `interface` 提供 Marketplace 展示。

### agents 在 Codex 中的处理

Codex 没有原生 `agents/` 目录发现机制。如果插件在 Claude/Qoder 中有 agents，对应到 Codex 时应：

- **提升为 skill**：将 agent 逻辑改写为 SKILL.md，放在 `skills/` 目录。
- **合并到现有 skill**：如果 agent 只是辅助某个 skill 工作，将 agent 的知识合并到对应 skill 的 references/ 中。

这是 `extensions-pattern.md` 中 Hooks 可移植性原则的延伸：不支持的组件类型应通过其他组件类型提供等效功能。

## 厂商约束（字数/行数限制）

| 组件                         | 字段/属性                 | 上限          | 说明                             |
| ---------------------------- | ------------------------- | ------------- | -------------------------------- |
| `interface.displayName`      | Marketplace 显示名        | 50 字符       | 列表页标题                       |
| `interface.shortDescription` | 简短描述                  | 200 字符      | 列表页摘要                       |
| `interface.longDescription`  | 详细描述                  | 5,000 字符    | 详情页正文                       |
| `interface.defaultPrompt`    | 默认提示语                | 每项 200 字符 | 引导用户输入                     |
| SKILL.md                     | `description` frontmatter | 1,024 字符    | 注入 system prompt，必须精炼     |
| plugin.json                  | `description`             | 2,000 字符    | 插件总体描述                     |
| plugin.json                  | `name`                    | 1–64 字符     | a-z + 0-9 + `-` + `.`            |
| `capabilities`               | 标签数组                  | 3 个元素      | 典型值: Interactive, Read, Write |

> **原则**：Codex 以 Marketplace 为导向，`interface` 字段的约束直接影响展示效果。`shortDescription` 的 200 字符上限是平台硬性限制。

## Skill 编写规则（来自 addyosmani/agent-skills 实践）

此表与三个厂商目录的 manifest-rules 同步，改动需三处一起。

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

## 分发模式

Codex 以 Marketplace 为核心分发渠道，`interface` 元数据的完整性直接影响插件在 Marketplace 中的展示效果：

- `displayName` 和 `shortDescription` 是列表页必填项
- `logo` 建议使用本地资源而非远程 URL
- `defaultPrompt` 帮助用户快速上手
- `capabilities` 标注插件能力边界

## 典型目录结构

```text
my-plugin/
├── plugin.json                  # 标准根 manifest
├── .codex-plugin/
│   ├── init.ts
│   └── plugin.json              # init 生成的 Codex manifest
├── skills/
│   └── greet/SKILL.md
├── .app.json                    # Codex App 配置（可选）
├── assets/
│   └── logo.png
└── README.md
```

## 实际案例：Vercel 插件

Codex 生态中的 Vercel 插件展示了完整的 `interface` 用法：

```json
{
  "name": "vercel",
  "version": "0.21.3",
  "description": "Build and deploy web apps and agents",
  "skills": "./skills/",
  "apps": "./.app.json",
  "interface": {
    "displayName": "Vercel",
    "shortDescription": "Build and deploy web apps and agents",
    "category": "Developer Tools",
    "capabilities": ["Interactive", "Write"],
    "websiteURL": "https://vercel.com/",
    "defaultPrompt": [
      "Audit this repo for Vercel deployment risks",
      "Which Vercel tools fit this app best"
    ],
    "logo": "./assets/logo-padded.png",
    "brandColor": "#000000"
  }
}
```
