---
name: repowiki
description: 'Generates a DeepWiki-style repository analysis report from repository structure, config, and dependencies, producing a single REPOWIKI.md with Mermaid diagrams and source-file references. Use when the user asks for a repository report, project documentation, codebase analysis, or wiki generation. Not for answering one-off questions about a repo, code review, or refactoring.'
when_to_use: '生成仓库报告, repowiki, deepwiki, 分析这个仓库, 生成项目文档, 仓库报告, 代码库分析, 生成wiki'
license: MIT
metadata:
  origin: https://github.com/mymx2/m2-plugins/skills/repowiki
  author: mymx2 <https://github.com/mymx2>
  version: 2026.05.11
  source: https://github.com/zzzhizhia/repowiki <MIT>
---

# RepoWiki

报告的价值在"为什么这样设计"，不在"罗列有什么"。只堆模块清单的报告是 README 的复读机——DeepWiki 级别的报告必须回答叙事弧线：问题是什么、朴素方案为什么行不通、本项目用了什么洞察。

## Overview

RepoWiki generates a DeepWiki-style repository analysis report. The report's value is in "why it was designed this way", not "what it has". A module-listing report is just README recitation — DeepWiki-level reports answer the narrative arc: what problem, why naive approaches fail, what insight the project uses.

## Outcome Contract

- **Outcome**: 仓库根目录的 `REPOWIKI.md`，通过文末质量检查清单。
- **Done when**: 每个核心系统有独立章节（含"问题 → 传统方案失效 → 本项目方案"叙事），每个事实可追溯到实际读过的文件，Mermaid 图语法可渲染。
- **Evidence**: 分析全部基于实际读取的文件与命令输出，零虚构文件、模块或依赖。
- **Output**: 单个 `REPOWIKI.md`（覆盖模式：已存在则覆盖）。
- **Authorization**: 只写 `REPOWIKI.md` 一个文件，不改动仓库其他任何文件。

> 该技能上下文占用大，建议需要生成报告时再安装，用完移除，避免常驻占位。

## When to Use

- Generating a repository analysis report or project documentation.
- Onboarding to an unfamiliar codebase and needing structured context.
- Creating wiki-style documentation for a project.
- Route to `read` for single-URL fetches; route to `check` for code review; route to `think` for architecture decisions.

## 分析执行流程

五步推进，先收集证据再动笔：

### 步骤 1：收集仓库元数据

调用可用的工具/命令并行收集：

1. **目录结构**——扫描 `**/*` 获取完整文件树
2. **包管理**——读取 `package.json`、`pnpm-workspace.yaml`、`go.mod`、`Cargo.toml`、`gradle/*.toml`、`pom.xml` 等
3. **配置文件**——读取 `tsconfig.json`、`.eslintrc.*`、`vite.config.*`、`**/build.gradle.kts` 等
4. **CI/CD**——读取 `.github/workflows/*.yml`、`.gitlab-ci.yml`、`Dockerfile` 等
5. **Git 历史**——从最近 100 次提交中统计文件变更频率

### 步骤 2：识别核心系统

以下信号辅助判断（不是绝对）：

| 信号         | 权重 | 方法                |
| ------------ | ---- | ------------------- |
| 文件变更频率 | 高   | git log 统计        |
| 入口文件引用 | 高   | grep import/require |
| 目录大小     | 中   | 文件数量            |
| README 提及  | 中   | 读取文档            |
| 导出数量     | 中   | grep export         |

### 步骤 3：深入分析每个系统

1. 读取该系统目录下的所有文件
2. 识别主要类、函数和类型定义——**带 `file#L<行号>-L<行号>` 引用**（如 `src/engine.ts#L1-L5`），方便读者跳转
3. 追踪导入/导出依赖链
4. 识别设计模式（Repository、Factory、Observer 等）
5. 提取关键配置和常量
6. 对关键算法或工作流做**逐步代码逻辑分析**——追踪实际实现，而不是只在接口层面描述

### 步骤 4：生成 Mermaid 图表

至少 1 个架构概览图、1 个模块依赖图、1 个核心工作流序列图；按需加状态图和数据流图。语法红线与图型要求见 references/report-format.md。

### 步骤 5：组装报告

按 references/report-format.md 的四层结构规范（项目概述 → 设计理念 → 模块分析 → 核心系统深度分析 → 基础设施）组装，写入 `REPOWIKI.md`。报告的篇幅、表格数量、源文件引用格式等硬性要求也在该文件中。

## Hard Rules

- **先读后写。** 没读过的文件不出现在报告里；推断必须标注为推断。
- **每个核心系统章节必须有决策对比表**（选择了什么、放弃了什么、为什么）。
- **Mermaid 标签禁用 `()` 和未转义的 `{}[]()`**——会破坏解析器；用全角括号或 `["..."]` 包裹。
- **报告语言与用户对话语言一致。**

## Common Rationalizations

- "扫一遍目录树和 README 就够写了" — 目录树是清单不是证据；没读过的文件写进报告就是虚构。
- "模块清单加架构图就是 DeepWiki 了" — 罗列"有什么"是 README 复读；报告必须回答"为什么这样设计"。
- "Mermaid 图画个大概、意思对就行" — 依赖图必须反映实际 import 关系；大概其的图比没有图更误导。

## Red Flags

- 报告里出现未实际读取的文件、模块或依赖
- 核心系统章节缺少"问题 → 传统方案失效 → 本项目方案"叙事或决策对比表
- Mermaid 标签含未转义的 `()[]{}`，图无法渲染
- 源文件引用缺少 `file#L行号` 锚点，读者无法跳转核对
- 报告语言与用户对话语言不一致
- 写入或改动 `REPOWIKI.md` 以外的任何仓库文件

## Verification

生成报告后逐项验证：

- [ ] 包含项目概述和一句话定位
- [ ] 技术栈表格完整准确
- [ ] 仓库结构 Mermaid 图与实际一致
- [ ] 每个核心系统有独立章节
- [ ] 每个章节有可折叠的源文件引用
- [ ] 模块依赖图正确反映实际依赖关系
- [ ] 至少一个序列图展示核心工作流
- [ ] 所有表格格式正确、内容准确
- [ ] 没有虚构的文件或模块
- [ ] Mermaid 图表语法正确且可渲染

## Non-goals

- 不回答关于仓库的零散问题（那是普通代码问答，不需要生成报告）。
- 不做代码审查或重构建议——报告是描述性的，不是处方性的。
- 不维护 REPOWIKI.md 的增量更新；内容过期就整体重新生成。
