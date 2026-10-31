/**
 * 四厂商 marketplace 注册门。
 *
 * AGENTS 要求每个插件同时出现在 Claude / Codex / Qoder / CodeBuddy 四份
 * marketplace 中。之前只有 Claude 那份有 schema 校验，其余三份缺失也不会红。
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const PACKAGE_JSON = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8')) as {
  version: string
}

const MARKETPLACES = [
  '.claude-plugin/marketplace.json',
  '.agents/plugins/marketplace.json',
  '.qoder-plugin/marketplace.json',
  '.codebuddy-plugin/marketplace.json',
]

interface MarketplaceEntry {
  name?: string
  version?: string
  source?: unknown
}

function pluginEntries(data: unknown): MarketplaceEntry[] {
  if (!data || typeof data !== 'object') return []
  const plugins = (data as { plugins?: unknown }).plugins
  if (Array.isArray(plugins)) return plugins as MarketplaceEntry[]
  const entries = (data as { entries?: unknown }).entries
  if (Array.isArray(entries)) return entries as MarketplaceEntry[]
  return []
}

function sourcePath(entry: MarketplaceEntry): string | undefined {
  const source = entry.source
  if (typeof source === 'string') return source
  if (source && typeof source === 'object') {
    const path = (source as { path?: unknown }).path
    if (typeof path === 'string') return path
  }
  return undefined
}

describe('四厂商 marketplace 注册', () => {
  for (const rel of MARKETPLACES) {
    it(`${rel} 存在并注册 dyc，版本与 package.json 一致`, () => {
      const path = join(REPO_ROOT, rel)
      expect(existsSync(path), `missing ${rel}`).toBe(true)
      const data = JSON.parse(readFileSync(path, 'utf-8'))
      const entries = pluginEntries(data)
      expect(entries.length, `${rel} has no plugin entries`).toBeGreaterThan(0)
      for (const entry of entries) {
        const source = sourcePath(entry)
        expect(source, `${rel} ${entry.name ?? '(unnamed)'} has no source`).toBeDefined()
        if (!source) continue
        const sourceDir = resolve(REPO_ROOT, source)
        expect(existsSync(sourceDir), `${rel} source missing: ${source}`).toBe(true)
        expect(
          existsSync(sourceDir) && statSync(sourceDir).isDirectory(),
          `${rel} source is not a directory: ${source}`,
        ).toBe(true)
      }
      const dyc = entries.find(entry => entry.name === 'dyc')
      expect(dyc, `${rel} does not register dyc`).toBeDefined()
      if (!dyc) return
      if (rel === '.qoder-plugin/marketplace.json') {
        const meta = (data as { metadata?: { version?: string } }).metadata
        expect(meta?.version, `${rel} metadata.version drift`).toBe(PACKAGE_JSON.version)
      } else {
        expect(dyc.version, `${rel} dyc version drift`).toBe(PACKAGE_JSON.version)
      }
    })
  }
})
