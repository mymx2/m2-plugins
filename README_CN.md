<div align="center">

[![author](https://img.shields.io/badge/author-🤖_mymx2-E07A28?logo=github)](https://github.com/mymx2)
[![License: MIT](https://img.shields.io/badge/License-MIT-A31F34)](https://mit-license.org)
[![skills.sh](https://skills.sh/b/mymx2/m2-plugins)](https://skills.sh/mymx2/m2-plugins)

[English](./README.md)

</div>

# M2 Plugins

AI Agent 插件市场，支持 **Claude Code**、**Codex**、**Qoder**、**CodeBuddy**。

## 插件

| 插件                    | 说明                      |
| ----------------------- | ------------------------- |
| [**dyc**](plugins/dyc/) | AI Agent 工程化工作流技能 |

每个插件自带 README，介绍技能详情与用法。

## 安装

选择你的 Agent：

<details>
<summary><b>Claude Code</b></summary>

```bash
# 1. 注册市场
/plugin marketplace add mymx2/m2-plugins

# 2. 安装插件
/plugin install dyc@m2-plugins
```

官方文档：[插件文档](https://code.claude.com/docs/zh-CN/discover-plugins)

```bash
# 列出已安装插件
/plugin list

# 禁用 / 启用 / 卸载
/plugin disable dyc@m2-plugins
/plugin enable dyc@m2-plugins
/plugin uninstall dyc@m2-plugins
```

**本地开发**

```bash
# 1. 克隆仓库并进入
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. 校验插件
claude plugin validate ./plugins/dyc

# 3. 免安装加载
claude --plugin-dir ./plugins/dyc
```

</details>

<details>
<summary><b>Codex</b></summary>

```bash
# 1. 注册市场
codex plugin marketplace add mymx2/m2-plugins

# 2. 安装插件
codex plugin add dyc@m2-plugins
```

官方文档：[插件文档](https://developers.openai.com/plugins/build/plugins)

```bash
# 浏览市场、安装或卸载插件；已安装插件按 Space 启用或禁用
/plugins
```

**本地开发**

```bash
# 1. 克隆仓库并进入
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. 重新生成 Codex 清单与 MCP 配置
vp run init

# 3. 将仓库作为本地市场添加后安装
codex
/plugins
```

</details>

<details>
<summary><b>Qoder</b></summary>

```bash
# 1. 注册市场
qodercli plugins marketplace add mymx2/m2-plugins

# 2. 安装插件
qodercli plugins install dyc
```

官方文档：[插件文档](https://docs.qoder.com/zh/cli/plugins)

```bash
# 列出已安装插件
qodercli plugins list

# 禁用 / 启用 / 卸载
qodercli plugins disable dyc
qodercli plugins enable dyc
qodercli plugins uninstall dyc
```

**本地开发**

```bash
# 1. 克隆仓库并进入
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. 校验插件
qodercli plugins validate ./plugins/dyc

# 3. 本地安装插件（复制到 ~/.qoder 与 ~/.qoder-cn）
vp run qoder:dyc

# 4. 在 TUI 中重载
/plugins reload
```

</details>

<details>
<summary><b>CodeBuddy</b></summary>

```bash
# 1. 注册市场
/plugin marketplace add mymx2/m2-plugins

# 2. 安装插件
/plugin install dyc@m2-plugins
```

官方文档：[插件文档](https://www.codebuddy.cn/docs/cli/plugin-marketplaces)

```bash
# 打开插件管理器（发现 / 已安装 / 市场 / 错误）
/plugin

# 禁用 / 启用 / 卸载
/plugin disable dyc@m2-plugins
/plugin enable dyc@m2-plugins
/plugin uninstall dyc@m2-plugins
```

**本地开发**

```bash
# 1. 克隆仓库并进入
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. 重新生成各厂商清单（根 init.ts 会调用含 CodeBuddy 在内的各厂商 init）
vp run init

# 3. 校验插件
codebuddy plugin validate ./plugins/dyc

# 4. 免安装加载
codebuddy --plugin-dir ./plugins/dyc
```

</details>

## 🏝️ 致谢

本项目深受以下优秀项目启发：

- [tw93/Waza](https://github.com/tw93/Waza) —— 核心技能来源（think、check、hunt、ui、read、write、learn、health）
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) —— 校验器与 lint 参考
- [mattpocock/skills](https://github.com/mattpocock/skills) —— 蒸馏参考

## 许可证

[MIT](./LICENSE) © 2025-PRESENT CDY
