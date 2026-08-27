#!/usr/bin/env tsx
/**
 * Codex (OpenAI) 插件初始化脚本
 *
 * 将标准 Agent Plugins Spec 的 plugin.json 适配为 Codex 格式。
 * 逻辑：标准字段为底，extensions['.codex-plugin'] 数据覆盖上去，写入。
 *
 * Codex 特有校验：
 *   - interface 必填字段（displayName, shortDescription, category）
 *   - URL 格式校验（website, privacy, terms）
 *   - brandColor hex 格式
 *   - assets 文件存在性（logo, composerIcon, screenshots）
 *   - defaultPrompt 格式
 *   - skill 深度校验（description 1024 上限、触发词、name-目录匹配、必需 section、死链）
 *   - references/ 链接解析检查
 *
 * MCP 适配：根 mcp.json 转为 Codex 官方格式（无 type 字段，
 * stdio=command / 远程=url + bearer_token_env_var，mcp_servers 包裹），
 * 生成 mcp.codex.json 供 manifest 指向。
 *
 * 用法：
 *   tsx .codex-plugin/init.ts [插件目录]
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lintSkillContent, lintReferenceLinks } from '../scripts/lib/skill-lint.ts'

const NAMESPACE = '.codex-plugin'

/** Marketplace 发布必填的 interface 字段 */
const REQUIRED_INTERFACE_FIELDS = ['displayName', 'shortDescription', 'category']

/** interface 中应为合法 URL 的字段 */
const URL_FIELDS = ['websiteURL', 'privacyPolicyURL', 'termsOfServiceURL']

/** 厂商约束 */
const SHORT_DESC_LIMIT = 200

// ─── 工具函数 ─────────────────────────────────────

function warn(msg: string): void {
  console.warn(`  ⚠ ${msg}`)
}

function fail(msg: string): void {
  console.error(`  ✗ ${msg}`)
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s)
    return true
  } catch {
    return false
  }
}

function isValidHex(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)
}

// ─── Codex 特有校验 ────────────────────────────────

/** 校验 interface 对象完整性 */
function validateInterface(output: Record<string, any>): void {
  const iface = output.interface
  if (!iface) {
    warn('缺少 interface 对象，Marketplace 展示将不完整')
    return
  }

  console.log(`  校验 interface（${Object.keys(iface).length} 个字段）`)

  // 必填字段
  for (const field of REQUIRED_INTERFACE_FIELDS) {
    if (!iface[field]) {
      warn(`interface.${field} 缺失（Marketplace 必填）`)
    }
  }

  // URL 格式
  for (const field of URL_FIELDS) {
    if (iface[field] && !isValidUrl(iface[field])) {
      warn(`interface.${field} 不是合法 URL: '${iface[field]}'`)
    }
  }

  // brandColor
  if (iface.brandColor && !isValidHex(iface.brandColor)) {
    warn(`interface.brandColor 不是合法 hex: '${iface.brandColor}'`)
  }

  // shortDescription 长度
  if (iface.shortDescription && iface.shortDescription.length > SHORT_DESC_LIMIT) {
    warn(
      `interface.shortDescription ${iface.shortDescription.length} 字符，建议 ≤ ${SHORT_DESC_LIMIT}`,
    )
  }

  // defaultPrompt
  if (iface.defaultPrompt) {
    if (!Array.isArray(iface.defaultPrompt) || iface.defaultPrompt.length === 0) {
      warn('interface.defaultPrompt 应为非空字符串数组')
    } else {
      for (const [i, p] of iface.defaultPrompt.entries()) {
        if (typeof p !== 'string') {
          warn(`interface.defaultPrompt[${i}] 应为字符串`)
        }
      }
    }
  }
}

/** 检查 interface 中引用的资源文件是否存在 */
function validateAssets(pluginRoot: string, output: Record<string, any>): void {
  const iface = output.interface
  if (!iface) return

  const assetFields = ['logo', 'composerIcon']
  for (const field of assetFields) {
    const p = iface[field]
    if (p && typeof p === 'string' && p.startsWith('./')) {
      const fullPath = join(pluginRoot, p)
      if (!existsSync(fullPath)) {
        warn(`interface.${field} 引用文件不存在: ${p}`)
      }
    }
  }

  if (Array.isArray(iface.screenshots)) {
    for (const [i, p] of iface.screenshots.entries()) {
      if (typeof p === 'string' && p.startsWith('./')) {
        const fullPath = join(pluginRoot, p)
        if (!existsSync(fullPath)) {
          warn(`interface.screenshots[${i}] 引用文件不存在: ${p}`)
        }
      }
    }
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

/** 校验 .app.json（如果声明了 apps 字段） */
function validateApp(pluginRoot: string, output: Record<string, any>): void {
  const appPath = output.apps
  if (!appPath) return

  const fullPath = join(pluginRoot, typeof appPath === 'string' ? appPath : '.app.json')
  if (!existsSync(fullPath)) {
    warn(`apps 声明指向 ${appPath}，但文件不存在`)
  } else {
    try {
      const raw = readFileSync(fullPath, 'utf-8')
      JSON.parse(raw)
      console.log(`  ✓ ${appPath} 格式合法`)
    } catch {
      warn(`${appPath}: JSON 解析失败`)
    }
  }
}

/** MCP 适配：按 Codex 官方规范生成 mcp.codex.json，由 manifest 的
 *  mcpServers 字段指向（不能用 .mcp.json 命名，避免被 Claude 默认加载）。
 *
 *  官方依据（developers.openai.com/plugins/build/plugins + /codex/config-reference）：
 *  - .mcp.json 内容为「直接 server 映射」或「mcp_servers 包裹对象」，这里用 mcp_servers 包裹
 *  - server 条目没有 type 字段：stdio 由 command 隐含，远程（streamable HTTP）由 url 隐含
 *  - 远程鉴权用 bearer_token_env_var（值为环境变量名），不收 headers 写法 */
function writeCodexMcp(pluginRoot: string): void {
  const mcpPath = join(pluginRoot, 'mcp.json')
  if (!existsSync(mcpPath)) return
  const mcp = JSON.parse(readFileSync(mcpPath, 'utf-8'))
  if (!mcp.mcpServers || typeof mcp.mcpServers !== 'object') return

  const out: Record<string, Record<string, unknown>> = {}
  for (const [name, cfg] of Object.entries(mcp.mcpServers as Record<string, any>)) {
    const { type, headers, ...rest } = { ...cfg }
    const c: Record<string, unknown> = rest
    if (type === 'streamable-http' || type === 'http') {
      // 远程 server：url 隐含类型；Bearer ${VAR} → bearer_token_env_var
      const auth = headers?.Authorization
      const m = /^Bearer \$\{(.+)\}$/.exec(typeof auth === 'string' ? auth : '')
      if (m) {
        c.bearer_token_env_var = m[1]
      } else if (headers) {
        warn(
          `mcp.json server '${name}': 存在非 Bearer 环境变量的 headers,Codex 需改用 http_headers/env_http_headers`,
        )
      }
    } else if (type !== 'stdio') {
      warn(
        `mcp.json server '${name}': 未知 type '${type}',已按字段推断(command=stdio / url=http)处理`,
      )
    }
    out[name] = c
  }

  writeFileSync(
    join(pluginRoot, 'mcp.codex.json'),
    JSON.stringify({ mcp_servers: out }, null, 2) + '\n',
  )
  console.log(`  ✓ mcp.codex.json 已生成(${Object.keys(out).length} 个 server)`)
}

// ─── 主函数 ────────────────────────────────────────

export function init(pluginRoot: string): void {
  console.log(`[${NAMESPACE}] 初始化开始`)

  // 第一步：读取根 plugin.json
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'plugin.json'), 'utf-8'))

  // 第二步：提取 extensions['.codex-plugin']
  const ext = manifest.extensions?.[NAMESPACE]
  if (!ext) {
    console.error(`未找到 extensions['${NAMESPACE}']，跳过`)
    return
  }

  // 第三步：合并（标准字段打底，剔除 extensions 和 $schema，厂商字段覆盖）
  // init 字段是构建期约定（指向本脚本），不是 Codex 官方清单字段，从产物中剔除
  const { extensions: _extensions, $schema: _$schema, ...base } = manifest
  const { init: _init, ...vendor } = ext
  const output = { ...base, ...vendor }

  // 第四步：写入 .codex-plugin/plugin.json
  const outputDir = join(pluginRoot, NAMESPACE)
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, 'plugin.json'), JSON.stringify(output, null, 2) + '\n')
  console.log(`  ✓ ${NAMESPACE}/plugin.json 已生成`)

  // 第五步：Codex 特有校验
  validateInterface(output)
  validateAssets(pluginRoot, output)
  validateSkills(pluginRoot)
  validateApp(pluginRoot, output)

  // 第六步：MCP 适配（生成 mcp.codex.json）
  writeCodexMcp(pluginRoot)

  console.log(`[${NAMESPACE}] 初始化完成`)
}

export default { init }

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  init(resolve(process.argv[2] ?? '.'))
}
