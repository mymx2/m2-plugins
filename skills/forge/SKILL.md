---
name: forge
description: 'Manages the agent-skill lifecycle: discover and install skills from the open ecosystem, operate the Skills CLI (npx skills), and author or validate new SKILL.md files. Use when users ask to find a skill for a task, install, update, or remove skills, learn a Skills CLI command, or scaffold and validate a new skill. Not for debugging an installed skill’s runtime behavior or reviewing prose.'
when_to_use: 'find skills, 找技能, 发现技能, 技能推荐, skills.sh, skills cli, npx skills, 安装技能, 管理技能, skills add, create skill, write SKILL.md, author skill, new skill, 新建技能, 编写技能, 技能模板, skill template'
license: MIT
metadata:
  origin: https://github.com/mymx2/skills/skills/forge
  author: mymx2 <https://github.com/mymx2>
---

# Forge

技能生态的全生命周期入口：找得到、装得上、写得出、验得过。

## Outcome Contract

- **Outcome**: 用户完成一次技能发现/安装/编写/校验操作，且有可运行命令或校验证据。
- **Done when**: 推荐核实过安装量与来源；安装类命令经用户确认；新 SKILL.md 通过 `scripts/validate-skill.ts` 全部门禁。
- **Evidence**: skills.sh 排行榜或 CLI 实际输出；`npx skills list` 状态；校验器退出码。
- **Authorization**: 搜索、查表、起草可直接做；安装、更新、移除会改动用户环境，经确认后执行。

## Process

1. 判断任务类型：找技能、管技能（装/更新/移除/查命令）、写技能、验技能。
2. 按下表加载对应 reference 或脚本，不凭记忆拼参数或规则。
3. 涉及环境改动的命令先给用户确认再代跑。
4. 收尾验证：`npx skills list` 确认安装结果；校验器 exit 0 确认编写结果。

## Mode Picker

| Ask                                           | Load                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 找技能、推荐技能、"有没有 X 的技能"           | `references/find-skills.md`                                                                                   |
| Skills CLI 命令用法、安装/更新/移除/CI 自动化 | `references/cli-guide.md`                                                                                     |
| 新建或编写 SKILL.md、技能结构规范             | `references/authoring-guide.md`                                                                               |
| 校验技能合规、修复门禁报错                    | 运行 `scripts/validate-skill.ts <skill-dir>`（规则说明见 `references/authoring-guide.md` 的 Evidence Ladder） |

## Hard Rules

- **推荐前先验证**：安装量、来源信誉、GitHub Star 数，三者核实后再推荐；找不到就明说并用通用能力直接帮忙。
- **frontmatter 契约不可协商**：name 匹配 kebab-case 目录名；description 40–500 字带触发与排除线索；不跨技能路径引用；脚本目录内自包含，三方依赖必须可选且缺失时优雅降级。
- **安装即环境改动**：`add` / `update` / `remove` 一律先给命令、经同意后执行。
- **项目里已有 `skills` 目录时**：`npx` 可能命名冲突，改用 `pnpx` 或 `vpx`。

## Gotchas

| What happened                    | Rule                                              |
| -------------------------------- | ------------------------------------------------- |
| 凭印象推荐技能                   | 推荐必须基于排行榜或 `npx skills find` 的实际输出 |
| description 不足 40 字被门禁拒绝 | 起草时就按 40–500 字写，不是校验失败再补          |
| 跨技能用路径引用导致安装副本断链 | 按名引用，路径引用过不了 isolation 门             |
| 技能目录留空文件夹               | 目录只在有文件时创建                              |
