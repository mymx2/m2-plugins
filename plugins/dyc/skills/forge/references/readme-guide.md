# README 编写指导

插件的 `README.md` 是用户和开发者了解插件的第一入口。不是营销文案，是技术说明书。

## 必须章节

按以下顺序组织，缺失任何一个应视为不完整：

### 1. 标题 + 一句话描述

```markdown
# <Display Name>

<一句话描述插件做什么>
```

### 2. Features / 功能

列出插件提供的核心能力，用无序列表。不夸大、不模糊。

```markdown
## Features

- 功能 A：具体做什么
- 功能 B：具体做什么
```

### 3. Installation / 安装

给出实际可运行的安装命令。区分项目级和全局安装。

````markdown
## Installation

```bash
# 项目级
npx skills add <source>

# 全局
npx skills add <source> -g
```
````

````

### 4. Prerequisites / 前置条件

列出插件依赖的外部工具、环境变量、账号等。MCP 插件必须在此文档化所有 env vars。

```markdown
## Prerequisites

- Node.js >= 18
- `GITHUB_TOKEN` 环境变量（用于 GitHub API 访问）
````

### 5. Usage / 使用

给出最基本的使用示例。复杂用法可链接到 skills/ 中的 SKILL.md。

### 6. Included Skills / 包含技能

列出 skills/ 目录中的技能，每个一行：名称 + 一句话说明触发条件。

```markdown
## Included Skills

| Skill      | Description        |
| ---------- | ------------------ |
| `greet`    | 生成项目欢迎信息   |
| `validate` | 校验插件结构合规性 |
```

## MCP 插件的额外要求

如果插件包含 `mcp.json`，README 必须有一个 **MCP Configuration** 章节，文档化：

- 每个 MCP server 的名称和用途
- 所有需要的环境变量及其含义
- 示例配置（如 CONNECTORS.md 中有设置说明，链接过去）

```markdown
## MCP Configuration

| Server            | Description   | Required Env Vars |
| ----------------- | ------------- | ----------------- |
| `local-validator` | 本地校验服务  | 无                |
| `remote-api`      | 远程 API 服务 | `API_KEY`         |
```

## README 与 SKILL.md 的关系

- **README** 面向人类：安装、配置、理解插件。
- **SKILL.md** 面向 Agent：何时触发、如何执行、安全约束。

两者的 description 应一致（说的是同一件事），但表达方式不同。README 可以更详细，SKILL.md 要精炼到 40–500 字符（校验器门禁；厂商硬上限 1,024 不是起草目标）。

## README 不应包含什么

- 不伪造不存在的功能或文件
- 不复制 SKILL.md 的完整内容
- 不包含硬编码的凭证或个人路径
- 不省略省略的文件——如果有组件被刻意省略，在 README 中说明原因

## 最小 README 模板

```markdown
# <Display Name>

<一句话描述>

## Features

- <核心功能>

## Installation

\`\`\`bash
npx skills add <source>
\`\`\`

## Prerequisites

- <前置条件>

## Included Skills

| Skill    | Description   |
| -------- | ------------- |
| `<name>` | <description> |

## License

<SPDX 标识符>
```
