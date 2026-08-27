#!/usr/bin/env tsx
/**
 * Claude Code 插件初始化脚本
 *
 * 将标准 Agent Plugins Spec 的 plugin.json 适配为 Claude Code 格式。
 * 逻辑：标准字段为底，extensions['.claude-plugin'] 数据覆盖上去，写入。
 *
 * Claude 特有校验：
 *   - commands/ frontmatter 完整性（description）
 *   - hooks 事件名合法性
 *   - ${CLAUDE_PLUGIN_ROOT} 路径引用检查
 *   - SKILL.md 深度校验（description 1024 上限、触发词、name-目录匹配、必需 section、死链）
 *   - references/ 链接解析检查
 *
 * MCP 适配：根 mcp.json 的 streamable-http 转为 http 后内联进生成的 manifest。
 *
 * 用法：
 *   tsx .claude-plugin/init.ts [插件目录]
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  lintSkillContent,
  lintReferenceLinks,
  parseFrontmatter,
} from '../scripts/lib/skill-lint.ts'

const NAMESPACE = '.claude-plugin'

/** Claude Code 已知钩子事件 */
const VALID_HOOK_EVENTS = new Set([
  'PreToolUse',
  'PostToolUse',
  'Stop',
  'SubagentStop',
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'PreCompact',
  'Notification',
])

// ─── 工具函数 ─────────────────────────────────────

function warn(msg: string): void {
  console.warn(`  ⚠ ${msg}`)
}

function fail(msg: string): void {
  console.error(`  ✗ ${msg}`)
}

function listMarkdownFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => join(dir, f))
  } catch {
    return []
  }
}

function extractFrontmatter(content: string): Record<string, string> {
  return parseFrontmatter(content) ?? {}
}

// ─── Claude 特有校验 ───────────────────────────────

/** 校验 commands/ 中每个 .md 文件的 frontmatter */
function validateCommands(pluginRoot: string): void {
  const dir = join(pluginRoot, 'commands')
  const files = listMarkdownFiles(dir)
  if (!files.length) return

  console.log(`  扫描 commands/（${files.length} 个文件）`)
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const fm = extractFrontmatter(content)
    const name = file.split(/[/\\]/).pop()
    if (!fm.description) {
      warn(`${name}: frontmatter 缺少 description`)
    }
  }
}

/** 校验 hooks/hooks.json 中的事件名 */
function validateHooks(pluginRoot: string): void {
  const hooksFile = join(pluginRoot, 'hooks', 'hooks.json')
  try {
    const raw = readFileSync(hooksFile, 'utf-8')
    const config = JSON.parse(raw)
    const hooks = config.hooks ?? config
    for (const event of Object.keys(hooks)) {
      if (!VALID_HOOK_EVENTS.has(event)) {
        warn(`hooks: 未知事件 '${event}'（已知: ${[...VALID_HOOK_EVENTS].join(', ')}）`)
      }
    }
    console.log(`  ✓ hooks/hooks.json 事件名合法`)
  } catch {
    // 不存在或不可解析 → 跳过
  }
}

/** 扫描 skills/ 目录，使用共享 skill-lint 深度校验 */
function validateSkills(pluginRoot: string): void {
  const dir = join(pluginRoot, 'skills')
  let entries: string[]
  try {
    entries = readdirSync(dir).filter(name => {
      try {
        return statSync(join(dir, name)).isDirectory()
      } catch {
        return false
      }
    })
  } catch {
    return
  }
  if (!entries.length) return

  const knownSkills = new Set(entries)
  let errorCount = 0
  let warnCount = 0

  console.log(`  扫描 skills/（${entries.length} 个目录）`)
  for (const name of entries) {
    const skillFile = join(dir, name, 'SKILL.md')
    try {
      const content = readFileSync(skillFile, 'utf-8')

      // 深度校验：description 1024 上限、触发词、name-目录匹配、必需 section、死链
      const result = lintSkillContent(name, content, knownSkills)
      for (const e of result.errors) {
        fail(`skills/${name}: ${e}`)
        errorCount++
      }
      for (const w of result.warnings) {
        warn(`skills/${name}: ${w}`)
        warnCount++
      }

      // references/ 链接解析检查
      const skillDir = join(dir, name)
      const refWarnings = lintReferenceLinks(content, (relPath: string) => {
        return existsSync(resolve(skillDir, relPath))
      })
      for (const w of refWarnings) {
        warn(`skills/${name}: ${w}`)
        warnCount++
      }
    } catch {
      fail(`skills/${name}/: 缺少 SKILL.md`)
      errorCount++
    }
  }

  if (errorCount === 0 && warnCount === 0) {
    console.log(`  ✓ skills/ 全部通过`)
  } else {
    console.log(`  → ${errorCount} error(s), ${warnCount} warning(s)`)
  }
}

/** 检查 .mcp.json 中路径引用是否使用了 ${CLAUDE_PLUGIN_ROOT} */
function validateMcpPaths(pluginRoot: string): void {
  const mcpFile = join(pluginRoot, '.mcp.json')
  try {
    const raw = readFileSync(mcpFile, 'utf-8')
    const text = raw
    // 检测可疑硬编码路径
    if (/\/(?:Users|home|usr|opt)\//.test(text)) {
      warn(`.mcp.json: 检测到硬编码绝对路径，请使用 \${CLAUDE_PLUGIN_ROOT}`)
    }
    console.log(`  ✓ .mcp.json 路径引用检查通过`)
  } catch {
    // 不存在 → 跳过
  }
}

// ─── 主函数 ────────────────────────────────────────

export function init(pluginRoot: string): void {
  console.log(`[${NAMESPACE}] 初始化开始`)

  // 第一步：读取根 plugin.json
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'plugin.json'), 'utf-8'))

  // 第二步：提取 extensions['.claude-plugin']
  const ext = manifest.extensions?.[NAMESPACE]
  if (!ext) {
    console.error(`未找到 extensions['${NAMESPACE}']，跳过`)
    return
  }

  // 第三步：合并（标准字段打底，剔除 extensions 和 $schema，厂商字段覆盖；$schema 从 ext 中自然带出）
  // init 字段是构建期约定（指向本脚本），不是 Claude 官方清单字段；
  // Claude 会忽略未知字段但 claude plugin validate 会告警，故从产物中剔除
  const { extensions: _extensions, $schema: _$schema, ...base } = manifest
  const { init: _init, ...vendor } = ext
  const output = { ...base, ...vendor }

  // 第三步半：MCP 适配 —— 根 mcp.json 的 streamable-http 类型 Claude 不认，
  // 转为 http 后内联进 manifest（Claude 支持内联 mcpServers，无需落盘 .mcp.json）
  const mcpPath = join(pluginRoot, 'mcp.json')
  if (existsSync(mcpPath)) {
    const mcp = JSON.parse(readFileSync(mcpPath, 'utf-8'))
    if (mcp.mcpServers && typeof mcp.mcpServers === 'object') {
      output.mcpServers = Object.fromEntries(
        Object.entries(mcp.mcpServers as Record<string, Record<string, unknown>>).map(
          ([name, cfg]) => [name, cfg?.type === 'streamable-http' ? { ...cfg, type: 'http' } : cfg],
        ),
      )
      console.log(`  ✓ mcp.json 已适配并内联（${Object.keys(output.mcpServers).length} 个 server）`)
    }
  }

  // 第四步：写入 .claude-plugin/plugin.json
  const outputDir = join(pluginRoot, NAMESPACE)
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, 'plugin.json'), JSON.stringify(output, null, 2) + '\n')
  console.log(`  ✓ ${NAMESPACE}/plugin.json 已生成`)

  // 第五步：Claude 特有校验
  validateCommands(pluginRoot)
  validateHooks(pluginRoot)
  validateSkills(pluginRoot)
  validateMcpPaths(pluginRoot)

  console.log(`[${NAMESPACE}] 初始化完成`)
}

export default { init }

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  init(resolve(process.argv[2] ?? '.'))
}
