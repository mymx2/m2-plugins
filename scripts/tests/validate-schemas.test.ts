/**
 * JSON Schema 校验测试 — 使用 ajv 校验项目中所有带 $schema 的 JSON 配置文件。
 *
 * 校验矩阵：
 *   plugins/<name>/plugin.json                → plugin.schema.json
 *   plugins/<name>/mcp.json                   → mcp.schema.json
 *   plugins/<name>/.claude-plugin/plugin.json → claude-code-plugin-manifest.schema.json
 *   .claude-plugin/marketplace.json           → claude-code-marketplace.schema.json
 *
 * 与 validate_repo.py 的关系：
 *   - validate_repo.py 做语义级验证（路径存在性、frontmatter、禁止文件等）。
 *   - 本文件做 JSON Schema 结构级验证（字段类型、必填、枚举、pattern 等）。
 *   - 两者互补，不重复。
 */

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { runSchemaValidation } from '../validate-schemas'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const PLUGINS_DIR = join(REPO_ROOT, 'plugins')

function discoverPlugins(): string[] {
  if (!existsSync(PLUGINS_DIR)) return []
  return readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.endsWith('-example'))
    .map(e => e.name)
    .sort()
}

const pluginNames = discoverPlugins()

describe('JSON Schema 校验 (ajv)', () => {
  it('全量校验通过', () => {
    const result = runSchemaValidation()
    if (!result.ok) {
      const failed = result.reports.filter(r => !r.valid)
      const detail = failed.map(r => `[${r.scope}] ${r.file}: ${r.errors}`).join('\n')
      expect.fail(`JSON Schema 校验失败:\n${detail}`)
    }
    expect(result.ok).toBe(true)
  })

  for (const name of pluginNames) {
    it(`插件 ${name} 全部 schema 校验通过`, () => {
      const result = runSchemaValidation(name)
      if (!result.ok) {
        const failed = result.reports.filter(r => !r.valid)
        const detail = failed.map(r => `${r.file}: ${r.errors}`).join('\n')
        expect.fail(`[${name}] schema 校验失败:\n${detail}`)
      }
    })
  }

  it('项目级 .claude-plugin/marketplace.json 符合 schema', () => {
    const result = runSchemaValidation() // 不传 pluginName，包含项目级校验
    const report = result.reports.find(
      r => r.scope === '(project)' && r.file.includes('marketplace.json'),
    )
    if (report && !report.valid) {
      expect.fail(`marketplace.json 校验失败:\n${report.errors}`)
    }
  })
})
