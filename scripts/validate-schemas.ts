/**
 * JSON Schema 校验脚本 — 使用 ajv 校验项目中的 JSON 配置文件。
 *
 * Schema 映射：
 *   plugins/<name>/plugin.json              → schemas/plugin.schema.json
 *   plugins/<name>/mcp.json                 → schemas/mcp.schema.json
 *   plugins/<name>/.claude-plugin/plugin.json → schemas/claude-code-plugin-manifest.schema.json
 *   .claude-plugin/marketplace.json         → schemas/claude-code-marketplace.schema.json
 *
 * 用法：
 *   vpx tsx scripts/validate-schemas.ts              # 校验所有
 *   vpx tsx scripts/validate-schemas.ts --plugin dyc  # 校验指定插件
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import type { ErrorObject, ValidateFunction } from 'ajv'

// ── 路径常量 ──────────────────────────────────────────────────────────────

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const SCHEMAS_DIR = join(REPO_ROOT, 'schemas')
const PLUGINS_DIR = join(REPO_ROOT, 'plugins')

// ── 插件内需要校验的文件与对应 schema ────────────────────────────────────

interface PluginFileTask {
  /** 相对插件根目录的文件路径 */
  file: string
  /** schemas/ 目录下的 schema 文件名 */
  schema: string
}

const PLUGIN_TASKS: PluginFileTask[] = [
  { file: 'plugin.json', schema: 'plugin.schema.json' },
  { file: 'mcp.json', schema: 'mcp.schema.json' },
  { file: '.claude-plugin/plugin.json', schema: 'claude-code-plugin-manifest.schema.json' },
]

// ── 项目级需要校验的文件与对应 schema ──────────────────────────────────────

interface ProjectFileTask {
  /** 相对项目根目录的文件路径 */
  file: string
  /** schemas/ 目录下的 schema 文件名 */
  schema: string
}

const PROJECT_TASKS: ProjectFileTask[] = [
  { file: '.claude-plugin/marketplace.json', schema: 'claude-code-marketplace.schema.json' },
]

// ── 解析 CLI 参数 ─────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { plugin?: string } {
  const idx = argv.indexOf('--plugin')
  if (idx !== -1 && argv[idx + 1]) {
    return { plugin: argv[idx + 1] }
  }
  const shortIdx = argv.indexOf('-p')
  if (shortIdx !== -1 && argv[shortIdx + 1]) {
    return { plugin: argv[shortIdx + 1] }
  }
  return {}
}

// ── 工具函数 ──────────────────────────────────────────────────────────────

function loadJson(path: string): unknown {
  const raw = readFileSync(path, 'utf-8')
  return JSON.parse(raw)
}

function discoverPlugins(): string[] {
  if (!existsSync(PLUGINS_DIR)) return []
  return readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.endsWith('-example'))
    .map(e => e.name)
    .sort()
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return ''
  return errors
    .map(e => {
      const path = e.instancePath || '/'
      const msg = e.message ?? 'unknown error'
      return `  ${path}: ${msg}`
    })
    .join('\n')
}

// ── 校验器初始化（自动识别 draft-07 / draft-2020-12）────────────────────

interface ValidationResult {
  valid: boolean
  errors: string
}

/** 缓存已创建的 validator，避免同一 schema 重复编译 */
const validatorCache = new Map<string, ValidateFunction>()

function getValidator(schemaFile: string): ValidateFunction {
  const cached = validatorCache.get(schemaFile)
  if (cached) return cached

  const schema = loadJson(join(SCHEMAS_DIR, schemaFile)) as Record<string, unknown>

  // 根据 schema 的 $schema 字段自动选择 Ajv 版本
  const metaSchema = schema.$schema
  const AjvClass = typeof metaSchema === 'string' && metaSchema.includes('2020') ? Ajv2020 : Ajv

  const ajv = new AjvClass({ allErrors: true, strict: false })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  validatorCache.set(schemaFile, validate)
  return validate
}

function validateFile(filePath: string, schemaFile: string, label: string): ValidationResult {
  if (!existsSync(filePath)) {
    return { valid: true, errors: '' } // 文件不存在不算 schema 校验失败
  }

  let data: unknown
  try {
    data = loadJson(filePath)
  } catch (err) {
    return { valid: false, errors: `[${label}] JSON 解析失败: ${(err as Error).message}` }
  }

  const validate = getValidator(schemaFile)
  const valid = validate(data)
  if (valid) {
    return { valid: true, errors: '' }
  }
  return { valid: false, errors: formatErrors(validate.errors) }
}

// ── 主逻辑 ──────────────────────────────────────────────────────────────

export interface SchemaValidationReport {
  scope: string
  file: string
  schema: string
  valid: boolean
  errors: string
}

export function runSchemaValidation(pluginName?: string): {
  ok: boolean
  reports: SchemaValidationReport[]
} {
  const plugins = pluginName ? [pluginName] : discoverPlugins()
  const reports: SchemaValidationReport[] = []
  let allOk = true

  const push = (report: SchemaValidationReport) => {
    reports.push(report)
    if (!report.valid) allOk = false
  }

  // 1. 插件级文件校验
  for (const name of plugins) {
    const pluginDir = join(PLUGINS_DIR, name)
    if (!existsSync(pluginDir)) {
      push({
        scope: name,
        file: '(plugin dir)',
        schema: '-',
        valid: false,
        errors: `插件目录不存在: ${pluginDir}`,
      })
      continue
    }

    for (const task of PLUGIN_TASKS) {
      const filePath = join(pluginDir, task.file)
      const result = validateFile(filePath, task.schema, name)
      push({
        scope: name,
        file: task.file,
        schema: task.schema,
        valid: result.valid,
        errors: result.errors,
      })
    }
  }

  // 2. 项目级文件校验（仅在未指定 --plugin 时执行）
  if (!pluginName) {
    for (const task of PROJECT_TASKS) {
      const filePath = join(REPO_ROOT, task.file)
      const relPath = relative(REPO_ROOT, filePath)
      const result = validateFile(filePath, task.schema, 'project')
      push({
        scope: '(project)',
        file: relPath,
        schema: task.schema,
        valid: result.valid,
        errors: result.errors,
      })
    }
  }

  return { ok: allOk, reports }
}

// ── CLI 入口 ──────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2))
const result = runSchemaValidation(args.plugin)

const scope = args.plugin ? `插件 '${args.plugin}'` : '全部'
console.log(`JSON Schema 校验 (${scope})`)
console.log()

for (const r of result.reports) {
  const icon = r.valid ? '✓' : '✗'
  console.log(`${icon} [${r.scope}] ${r.file} → ${r.schema}`)
  if (!r.valid && r.errors) {
    console.log(r.errors)
    console.log()
  }
}

if (result.ok) {
  console.log('通过: 所有文件均符合 JSON Schema 规范')
} else {
  const failed = result.reports.filter(r => !r.valid)
  console.log(`失败: ${failed.length} 个文件不符合规范`)
  process.exit(1)
}
