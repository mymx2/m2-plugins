---
name: repowiki
description: 'Generates a DeepWiki-style repository wiki from repository structure, config, and dependencies, producing a single REPOWIKI.md with Mermaid diagrams and source-file references. Use when the user asks for a repository report, project documentation, codebase analysis, or wiki generation. Not for answering one-off questions about a repo, code review, refactoring, general prose documentation (route to write), or source-bundle synthesis (route to learn).'
when_to_use: 'repowiki, deepwiki, 仓库报告, 项目文档, repo wiki, codebase analysis'
license: MIT
metadata:
  origin: https://github.com/mymx2/m2-plugins/skills/repowiki
  author: mymx2 <https://github.com/mymx2>
  version: 2026.05.11
  source: https://github.com/zzzhizhia/repowiki <MIT>
---

# RepoWiki

报告的价值在"为什么这样设计"，不在"罗列有什么"——DeepWiki 级别的报告必须回答叙事弧线：问题是什么、朴素方案为什么行不通、本项目用了什么洞察。

## Overview

RepoWiki generates a DeepWiki-style repository analysis report from repository structure, config, and dependencies, producing a single `REPOWIKI.md` with Mermaid diagrams and source-file references.

## Outcome Contract

- **Outcome**: 仓库根目录的 `REPOWIKI.md`，通过文末质量检查清单。
- **Done when**: 每个核心系统有独立章节（含"问题 → 传统方案失效 → 本项目方案"叙事，结构见 references/report-format.md），每个事实可追溯到实际读过的文件，Mermaid 图语法可渲染。
- **Evidence**: 分析全部基于实际读取的文件与命令输出，零虚构文件、模块或依赖。
- **Output**: 单个 `REPOWIKI.md`（覆盖模式：已存在则覆盖）。
- **Authorization**: 只写 `REPOWIKI.md` 一个文件，不改动仓库其他任何文件。

## When to Use

- Generating a repository analysis report or project documentation.
- Onboarding to an unfamiliar codebase and needing structured context.
- Creating wiki-style documentation for a project.
- Route to `read` for single-URL fetches; route to `check` for code review; route to `think` for architecture decisions.

## Process

五步推进，先收集证据再动笔：

### 步骤 1：收集仓库元数据

调用可用的工具/命令并行收集：

1. **目录结构**——扫描 `**/*` 获取完整文件树
2. **包管理与构建配置**——package manifests, build config, CI workflows
3. **Git 历史**——从最近 100 次提交中统计文件变更频率

### 步骤 2：识别核心系统

以下信号辅助判断（不是绝对）：

按变更频率、入口引用、目录大小、README 提及、导出数量综合判断（权重递减）。

识别出的每个核心系统/模块/外部依赖，按 references/evidence-model.md 的节点字段登记（type、state、sourceRefs、confidence）；现状节点证据要求与 unknown 标注规则以该文件为准。

### 步骤 3：深入分析每个系统

1. 读取该系统目录下的所有文件
2. 识别主要类、函数和类型定义，引用格式按 references/report-format.md 的源文件引用规范
3. 追踪导入/导出依赖链，按 references/evidence-model.md 的边字段记录（type、protocol、sourceRefs、confidence）；推断出的关系必须 confidence=low 并在报告中写明是推断
4. 识别设计模式（Repository、Factory、Observer 等）
5. 提取关键配置和常量
6. 对关键算法或工作流做**逐步代码逻辑分析**——追踪实际实现，而不是只在接口层面描述

### 步骤 4：生成 Mermaid 图表

至少 1 个架构概览图、1 个模块依赖图、1 个核心工作流序列图；若系统含状态机或数据流转，加对应状态图和数据流图。语法红线与图型要求见 references/report-format.md。

### 步骤 5：组装报告

按 references/report-format.md 的分层结构（项目概述 → 设计理念 → 模块分析 → 核心系统 → 基础设施）组装，写入 `REPOWIKI.md`。报告的篇幅、表格数量、源文件引用格式等硬性要求也在该文件中。

## Hard Rules

- **先读后写。** 没读过的文件不出现在报告里；推断必须标注为推断。
- 语法红线（决策对比表、Mermaid 特殊字符、`file#L` 锚点、密度规则）以 `references/report-format.md` 为准。

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

生成报告后逐项验证（结构、格式与语法红线见 `references/report-format.md`，这里只核对报告与仓库事实的一致性）：

- [ ] 仓库结构 Mermaid 图与实际一致
- [ ] 模块依赖图正确反映实际依赖关系
- [ ] 每个核心系统/模块/依赖能反问出证据模型的 sourceRefs 与 confidence；推断性论断已显式标注

## Non-goals

不做代码审查/重构建议、零散问题解答、增量更新维护；内容过期就整体重新生成。
