#!/usr/bin/env node
/**
 * validate-plugin.ts — forge 的插件级校验 CLI。
 *
 * 对插件根目录执行 Agent Plugins Spec 合规检查（10 道门）：
 *   1. plugin.json 存在且可解析为 JSON
 *   2. $schema 字段存在且为已知版本
 *   3. name 字段存在且符合命名规则
 *   4. 无未知顶层字段
 *   5. extensions 为对象（非对象则报告并跳过）
 *   6. 每个 extensions 命名空间的 init 脚本存在性检查
 *   7. mcp.json 存在时的 $schema 一致性 + 基本结构 + 非空校验
 *   8. 组件路径存在性（声明了但不存在则 warning）
 *   9. 重复 skill name 检查
 *  10. 禁止文件检查（打包卫生）
 *
 * 与 validate-skill.ts 并行使用：validate-skill.ts 校验单个技能，
 * validate-plugin.ts 校验插件整体结构。
 *
 * 用法：node validate-plugin.ts <插件根目录>
 * 零第三方依赖，Node >= 23 直接运行（原生 type stripping）。
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// ── 错误处理 ──────────────────────────────────────────────────────────────

export class FailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FailError'
  }
}

export function fail(message: string): never {
  throw new FailError(message)
}

// ── 已知 $schema 版本 ─────────────────────────────────────────────────────

const KNOWN_SCHEMAS = new Set(['https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'])

const KNOWN_MCP_SCHEMAS = new Set(['https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'])

// ── 标准顶层字段白名单 ─────────────────────────────────────────────────────

const PERMITTED_TOP_LEVEL_FIELDS = new Set([
  '$schema',
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
  'extensions',
])

// ── 命名规则 ─────────────────────────────────────────────────────────────

const NAME_RE = /^[a-z0-9][a-z0-9.-]{0,62}[a-z0-9]$|^[a-z0-9]$/
const NO_CONSECUTIVE_HYPHENS = /--/
const NO_CONSECUTIVE_DOTS = /\.\./

function validateName(name: string): string[] {
  const errors: string[] = []

  if (typeof name !== 'string' || name.length === 0) {
    errors.push('name is empty or not a string')
    return errors
  }
  if (name.length > 64) {
    errors.push(`name too long: ${name.length} chars (max 64)`)
  }
  if (!NAME_RE.test(name)) {
    errors.push(
      `name contains invalid characters: '${name}' (allowed: a-z, 0-9, -, .; must start/end with alphanumeric)`,
    )
  }
  if (NO_CONSECUTIVE_HYPHENS.test(name)) {
    errors.push(`name contains consecutive hyphens: '${name}'`)
  }
  if (NO_CONSECUTIVE_DOTS.test(name)) {
    errors.push(`name contains consecutive dots: '${name}'`)
  }
  return errors
}

// ── 门 1：plugin.json 存在且可解析 ──────────────────────────────────────

function checkManifestExists(pluginRoot: string): Record<string, unknown> {
  const manifestPath = path.join(pluginRoot, 'plugin.json')
  if (!existsSync(manifestPath)) {
    fail(`plugin.json NOT FOUND: ${manifestPath}`)
  }
  if (!statSync(manifestPath).isFile()) {
    fail(`plugin.json is not a regular file: ${manifestPath}`)
  }
  try {
    const content = readFileSync(manifestPath, 'utf-8')
    const parsed = JSON.parse(content)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      fail('plugin.json root is not an object')
    }
    console.log('ok: plugin.json exists and parses as JSON object')
    return parsed as Record<string, unknown>
  } catch (err) {
    if (err instanceof FailError) throw err
    fail(`plugin.json parse error: ${(err as Error).message}`)
  }
}

// ── 门 2：$schema 已知版本 ──────────────────────────────────────────────

function checkSchema(manifest: Record<string, unknown>): string {
  const schema = manifest['$schema']
  if (typeof schema !== 'string' || !schema) {
    fail('$schema field is missing or not a string')
  }
  if (!KNOWN_SCHEMAS.has(schema)) {
    fail(`$schema version not recognized: '${schema}' (known: ${[...KNOWN_SCHEMAS].join(', ')})`)
  }
  console.log(`ok: $schema = ${schema}`)
  return schema
}

// ── 门 3：name 命名规则 ─────────────────────────────────────────────────

function checkName(manifest: Record<string, unknown>): void {
  const name = manifest['name']
  if (typeof name !== 'string' || !name) {
    fail('name field is missing or not a string')
  }
  const errors = validateName(name)
  if (errors.length > 0) {
    fail(`name validation failed:\n  ${errors.join('\n  ')}`)
  }
  console.log(`ok: name = '${name}'`)
}

// ── 门 4：无未知顶层字段 ────────────────────────────────────────────────

function checkNoUnknownFields(manifest: Record<string, unknown>): void {
  const unknownFields = Object.keys(manifest).filter(k => !PERMITTED_TOP_LEVEL_FIELDS.has(k))
  if (unknownFields.length > 0) {
    fail(
      `unknown top-level fields: ${unknownFields.join(', ')} (permitted: ${[...PERMITTED_TOP_LEVEL_FIELDS].join(', ')})`,
    )
  }
  console.log('ok: no unknown top-level fields')
}

// ── 门 5：extensions 为对象 ─────────────────────────────────────────────

function checkExtensions(manifest: Record<string, unknown>): Record<string, unknown> | null {
  const extensions = manifest['extensions']
  if (extensions === undefined) {
    console.log('skip: extensions field not present')
    return null
  }
  if (typeof extensions !== 'object' || extensions === null || Array.isArray(extensions)) {
    fail('extensions field is not an object (must be { namespace: { ... } })')
  }
  const ext = extensions as Record<string, unknown>
  const namespaces = Object.keys(ext)
  console.log(`ok: extensions has ${namespaces.length} namespace(s): ${namespaces.join(', ')}`)
  return ext
}

// ── 门 6：init 脚本存在性 ──────────────────────────────────────────────

function checkInitScripts(pluginRoot: string, extensions: Record<string, unknown> | null): void {
  if (!extensions) {
    console.log('skip: no extensions to check init scripts')
    return
  }
  for (const [ns, data] of Object.entries(extensions)) {
    if (typeof data !== 'object' || data === null) continue
    const extData = data as Record<string, unknown>
    const initPath = extData['init']
    if (typeof initPath !== 'string' || !initPath) {
      console.log(`skip: ${ns} has no init field`)
      continue
    }
    const resolved = path.join(pluginRoot, initPath)
    if (!existsSync(resolved)) {
      fail(
        `init script not found: ${ns} declares init='${initPath}' but file does not exist at ${resolved}`,
      )
    }
    console.log(`ok: ${ns} init script exists at ${initPath}`)
  }
}

// ── 门 7：mcp.json 一致性 ──────────────────────────────────────────────

function checkMcpConsistency(pluginRoot: string, pluginSchema: string): void {
  const mcpPath = path.join(pluginRoot, 'mcp.json')
  if (!existsSync(mcpPath)) {
    console.log('skip: mcp.json not present')
    return
  }
  if (!statSync(mcpPath).isFile()) {
    fail('mcp.json exists but is not a regular file')
  }

  let mcp: Record<string, unknown>
  try {
    mcp = JSON.parse(readFileSync(mcpPath, 'utf-8'))
  } catch (err) {
    fail(`mcp.json parse error: ${(err as Error).message}`)
  }

  if (typeof mcp !== 'object' || mcp === null || Array.isArray(mcp)) {
    fail('mcp.json root is not an object')
  }

  // 检查 $schema
  const mcpSchema = mcp['$schema']
  if (typeof mcpSchema !== 'string' || !mcpSchema) {
    fail('mcp.json missing $schema field')
  }
  if (!KNOWN_MCP_SCHEMAS.has(mcpSchema)) {
    fail(`mcp.json $schema not recognized: '${mcpSchema}'`)
  }

  // 检查版本一致性：mcp.json 的 $schema 版本应与 plugin.json 的 $schema 版本匹配
  const pluginVersion = pluginSchema.match(/\/(\d+\.\d+\.\d+)\//)?.[1]
  const mcpVersion = mcpSchema.match(/\/(\d+\.\d+\.\d+)\//)?.[1]
  if (pluginVersion && mcpVersion && pluginVersion !== mcpVersion) {
    fail(
      `$schema version mismatch: plugin.json targets ${pluginVersion}, mcp.json targets ${mcpVersion}`,
    )
  }

  // 检查 mcpServers 字段
  const servers = mcp['mcpServers']
  if (servers === undefined) {
    fail('mcp.json missing mcpServers field')
  }
  if (typeof servers !== 'object' || servers === null || Array.isArray(servers)) {
    fail('mcp.json mcpServers is not an object')
  }

  const serverCount = Object.keys(servers as Record<string, unknown>).length
  if (serverCount === 0) {
    fail('mcp.json mcpServers is empty (no servers defined). Remove mcp.json if MCP is not needed.')
  }
  console.log(`ok: mcp.json valid ($schema=${mcpSchema}, ${serverCount} server(s))`)
}

// ── 门 8：组件路径存在性（extensions 中声明的路径必须实际存在）────────────
function checkComponentPaths(
  pluginRoot: string,
  extensions: Record<string, unknown> | null,
): string[] {
  const warnings: string[] = []
  if (!extensions) return warnings

  // extensions 中可能声明的组件路径字段
  const PATH_FIELDS = ['skills', 'rules', 'agents', 'commands', 'workflows', 'hooks', 'mcpServers']

  for (const [ns, data] of Object.entries(extensions)) {
    if (typeof data !== 'object' || data === null) continue
    const extData = data as Record<string, unknown>

    for (const field of PATH_FIELDS) {
      const value = extData[field]
      if (typeof value !== 'string' || !value) continue

      const resolved = path.join(pluginRoot, value)
      if (!existsSync(resolved)) {
        warnings.push(`${ns}: declared ${field}='${value}' but path does not exist at ${resolved}`)
      }
    }
  }

  for (const w of warnings) {
    console.warn(`  ⚠ ${w}`)
  }
  if (!warnings.length) {
    console.log('ok: all declared component paths exist')
  }
  return warnings
}

// ── 门 9：重复 skill name 检查 ─────────────────────────────────────────

function checkDuplicateSkillNames(pluginRoot: string): void {
  const skillsDir = path.join(pluginRoot, 'skills')
  if (!existsSync(skillsDir) || !statSync(skillsDir).isDirectory()) {
    console.log('skip: no skills/ directory')
    return
  }

  const entries = readdirSync(skillsDir, { withFileTypes: true })
  const nameToDirs = new Map<string, string[]>()

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillMd = path.join(skillsDir, entry.name, 'SKILL.md')
    if (!existsSync(skillMd)) continue

    const content = readFileSync(skillMd, 'utf-8')
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
    if (!fmMatch) continue

    const nameMatch = fmMatch[1].match(/^name:\s*(.+)$/m)
    if (!nameMatch) continue
    const skillName = nameMatch[1].trim().replace(/^['"]|['"]$/g, '')

    const existing = nameToDirs.get(skillName) ?? []
    existing.push(entry.name)
    nameToDirs.set(skillName, existing)
  }

  const duplicates = [...nameToDirs.entries()].filter(([, dirs]) => dirs.length > 1)
  if (duplicates.length > 0) {
    const msg = duplicates
      .map(([name, dirs]) => `skill name '${name}' used in: ${dirs.join(', ')}`)
      .join('\n  ')
    fail(`duplicate skill names found:\n  ${msg}`)
  }
  console.log(`ok: no duplicate skill names (${nameToDirs.size} skill(s) scanned)`)
}

// ── 门 10：禁止文件检查 ─────────────────────────────────────────────────

const FORBIDDEN_FILES = new Set([
  '.DS_Store',
  '__MACOSX',
  'Thumbs.db',
  '.env',
  '.env.local',
  'node_modules',
])

function checkForbiddenFiles(pluginRoot: string): void {
  const found: string[] = []

  function scan(dir: string, depth: number): void {
    if (depth > 3) return // 不递归太深
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      // 跳过厂商目录和隐藏目录（.git 等）
      if (
        entry.name.startsWith('.<vendor>') ||
        (entry.name.startsWith('.') && entry.name !== '.env' && entry.name !== '.env.local')
      )
        continue
      if (
        entry.name === '.git' ||
        entry.name === '.qoder-plugin' ||
        entry.name === '.claude-plugin' ||
        entry.name === '.codex-plugin'
      )
        continue

      if (FORBIDDEN_FILES.has(entry.name) || entry.name === 'node_modules') {
        found.push(path.relative(pluginRoot, path.join(dir, entry.name)))
      }
      if (entry.isDirectory() && !FORBIDDEN_FILES.has(entry.name)) {
        scan(path.join(dir, entry.name), depth + 1)
      }
    }
  }

  scan(pluginRoot, 0)
  if (found.length > 0) {
    fail(`forbidden files found:\n  ${found.join('\n  ')}`)
  }
  console.log('ok: no forbidden files')
}

// ── 编排 ─────────────────────────────────────────────────────────────────

export function validatePlugin(pluginRoot: string): string[] {
  const failures: string[] = []
  const gate = (label: string, run: () => void): void => {
    try {
      run()
    } catch (err) {
      if (err instanceof FailError) {
        failures.push(`[${label}] ${err.message}`)
      } else {
        throw err
      }
    }
  }

  let manifest: Record<string, unknown> = {}
  let pluginSchema = ''
  let extensions: Record<string, unknown> | null = null

  gate('manifest-exists', () => {
    manifest = checkManifestExists(pluginRoot)
  })

  gate('schema', () => {
    pluginSchema = checkSchema(manifest)
  })

  gate('name', () => {
    checkName(manifest)
  })

  gate('no-unknown-fields', () => {
    checkNoUnknownFields(manifest)
  })

  gate('extensions', () => {
    extensions = checkExtensions(manifest)
  })

  gate('init-scripts', () => {
    checkInitScripts(pluginRoot, extensions)
  })

  gate('mcp-consistency', () => {
    checkMcpConsistency(pluginRoot, pluginSchema)
  })

  // 门 8：组件路径存在性（warning，不致命）
  checkComponentPaths(pluginRoot, extensions)

  gate('duplicate-skill-names', () => {
    checkDuplicateSkillNames(pluginRoot)
  })

  gate('forbidden-files', () => {
    checkForbiddenFiles(pluginRoot)
  })

  return failures
}

// ── CLI 入口 ──────────────────────────────────────────────────────────────

const isMain =
  !!process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  const input = process.argv[2]
  if (!input) {
    console.error('usage: node validate-plugin.ts <plugin-root-dir>')
    process.exit(1)
  }
  try {
    const failures = validatePlugin(path.resolve(input))
    if (failures.length > 0) {
      console.error(`\nFAILED: ${failures.length} gate(s) failed`)
      for (const message of failures) console.error(`\n${message}`)
      process.exit(1)
    }
    console.log('\nPASSED: all plugin gates green')
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}
