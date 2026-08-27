---
name: forge
description: '插件与技能的全生命周期管理：基于 Agent Plugins Spec 创建标准插件、通过 extensions + init 模式适配多厂商（Claude Code / Qoder / Codex），以及发现、安装、编写、校验技能。Use when users ask to create a plugin, scaffold multi-vendor plugin, write plugin.json, generate init.ts, find/install skills, or author/validate SKILL.md. Not for runtime debugging of deployed skills (route to hunt) or reviewing plugin code quality (route to check).'
when_to_use: 'plugin, 插件, create plugin, 创建插件, plugin.json, init.ts, extensions, manifest, 多厂商, multi-vendor, scaffold, 脚手架, 厂商适配, claude-plugin, qoder-plugin, codex-plugin, find skills, 找技能, skills.sh, skills cli, npx skills, 安装技能, create skill, write SKILL.md, author skill, 新建技能, 编写技能, skill template, validate skill, 校验技能'
license: MIT
metadata:
  origin: https://github.com/mymx2/m2-plugins/skills/forge
  author: mymx2 <https://github.com/mymx2>
---

# Forge

插件与技能的全生命周期入口：建得了、适得通、找得到、装得上、写得出、验得过。

## Overview

Forge 是插件与技能的全生命周期路由层：判断任务属于哪个阶段（建/适配/找/管/写/验），加载对应的 reference 或脚本，不在记忆里拼参数。

## Outcome Contract

- **Outcome**: 用户完成一次插件创建/厂商适配/技能发现/安装/编写/校验操作，且有可运行命令或校验证据。
- **Done when**: 标准 plugin.json 符合 Agent Plugins Spec；厂商 init.ts 可执行；安装类命令经用户确认；新 SKILL.md 通过 `scripts/validate-skill.ts` 全部门禁。
- **Evidence**: `scripts/validate-plugin.ts` 退出码；`npx skills list` 状态；校验器退出码。
- **Authorization**: 搜索、查表、起草可直接做；安装、更新、移除会改动用户环境，经确认后执行。

## When to Use

- 从零创建标准插件（plugin.json + extensions + init.ts）。
- 为已有插件添加或修改厂商适配（Claude Code / Qoder / Codex）。
- 搜索、推荐、安装、更新、移除技能。
- 编写新 SKILL.md 或修复校验门禁报错。
- Route to `hunt` for runtime debugging of deployed skills; route to `check` for reviewing plugin code quality.

## Process

1. 判断任务类型：建插件、厂商适配、找技能、管技能（装/更新/移除/查命令）、写技能、验技能。
2. 按下表加载对应 reference 或脚本，不凭记忆拼参数或规则。
3. 涉及环境改动的命令先给用户确认再代跑。
4. 收尾验证：`scripts/validate-plugin.ts` 确认插件合规；`npx skills list` 确认安装结果；校验器 exit 0 确认编写结果。

## Mode Picker

| Ask                                           | Load                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 创建插件、plugin.json、标准骨架               | `references/plugin-spec.md`                                                                                   |
| 多厂商适配、extensions、init.ts               | `references/extensions-pattern.md` + 对应厂商目录（`claude/`、`qoder/`、`codex/`）                            |
| 找技能、推荐技能、"有没有 X 的技能"           | `references/find-plugins.md`                                                                                  |
| Skills CLI 命令用法、安装/更新/移除/CI 自动化 | `references/cli-guide.md`                                                                                     |
| 新建或编写 SKILL.md、技能结构规范             | `references/skill-authoring.md`                                                                               |
| 编写 README、插件说明文档                     | `references/readme-guide.md`                                                                                  |
| 校验技能合规、修复门禁报错                    | 运行 `scripts/validate-skill.ts <skill-dir>`（规则说明见 `references/skill-authoring.md` 的 Evidence Ladder） |

## Common Rationalizations

- "插件结构很简单，不需要 spec" — Agent Plugins Spec 的封闭字段集和 extensions 模式避免了厂商锁定；跳过 spec 意味着每个厂商都要手动维护。
- "init.ts 跑一次就够了" — 不幂等的 init 在每次 rebase 后都会产生 diff；幂等性比速度重要。
- "凭经验推荐热门技能" — 排行榜和 `npx skills find` 的输出才是证据；记忆中的安装量可能已过期。

## Red Flags

- 直接编辑厂商目录下的 plugin.json 而不是根 plugin.json 的 extensions。
- 推荐技能时无法提供排行榜链接或 `npx skills find` 的实际输出。
- 起草 SKILL.md 时先写正文再补 frontmatter（应先定契约再写内容）。
- 在没有 `scripts/validate-plugin.ts` 或 `validate-skill.ts` 的情况下声称校验通过。

## Verification

1. 插件创建/修改后：`scripts/validate-plugin.ts <plugin-root>` 退出码 0。
2. 技能编写/修改后：`scripts/validate-skill.ts <skill-dir>` 全部门禁绿。
3. 安装/更新/移除后：`npx skills list` 状态与预期一致。

## Output Summary

完成插件创建或修改后，输出以下摘要：

```markdown
### Plugin

- **Plugin**: <插件根目录绝对路径>
- **Skill(s)**: <skills/<name>/SKILL.md 列表或 none>
- **Vendors**: <已适配厂商列表：claude / qoder / codex>
- **Validation**: `validate-plugin.ts` 退出码 + 警告数
- **Next**: 下一步建议（如安装测试、提交 git）
```

完成技能编写或校验后，输出以下摘要：

```markdown
### Skill

- **Skill**: <技能目录绝对路径>/SKILL.md
- **Gates**: `validate-skill.ts` 七门结果（全绿，或失败门清单 + 修复建议）
- **Supporting files**: <references/ scripts/ 列表或 none>
- **Next**: 下一步建议（如真实输入 dogfood、提交 git）
```

## Hard Rules

- **根 plugin.json 是唯一事实源**：厂商目录下的 plugin.json 是 init.ts 生成的衍生物，不手动维护。
- **init.ts 可增长但必须幂等**：重复运行结果一致，每次都从标准源重新生成。
- **推荐前先验证**：安装量、来源信誉、GitHub Star 数，三者核实后再推荐；找不到就明说并用通用能力直接帮忙。
- **frontmatter 契约不可协商**：name 匹配 kebab-case 目录名；description 40–500 字带触发与排除线索；不跨技能路径引用；脚本目录内自包含，三方依赖必须可选且缺失时优雅降级。
- **安装即环境改动**：`add` / `update` / `remove` 一律先给命令、经同意后执行。
- **项目里已有 `skills` 目录时**：`npx` 可能命名冲突，改用 `pnpx` 或 `vpx`。

## Gotchas

| What happened                    | Rule                                     |
| -------------------------------- | ---------------------------------------- |
| description 不足 40 字被门禁拒绝 | 起草时就按 40–500 字写，不是校验失败再补 |
| 跨技能用路径引用导致安装副本断链 | 按名引用，路径引用过不了 isolation 门    |
| 技能目录留空文件夹               | 目录只在有文件时创建                     |
