#!/usr/bin/env tsx
/**
 * 仓库级初始化脚本（版本填充 + 厂商适配 + marketplace 同步）
 *
 * 版本流（package.json 为唯一事实源）：
 *   package.json
 *     → plugins/<name>/plugin.json            本脚本填充
 *     → plugins/<name>/.<vendor>/plugin.json  调用各厂商 init.ts 重新生成（版本随根 manifest 带入）
 *     → 根目录各级 marketplace.json            本脚本同步（仅填充已存在的 version 字段）
 *
 * 用法：
 *   vpx tsx init.ts           填充并重新生成（幂等）
 *   vpx tsx init.ts --check   仅校验版本一致性，发现漂移时退出码 1
 */

/// <reference types="node" />
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = dirname(fileURLToPath(import.meta.url))
const CHECK_ONLY = process.argv.includes('--check')

/** check 模式下收集的版本漂移记录 */
const drifts: string[] = []

/** 填充模式下写入过的文件（收尾统一 vp fmt，避免与格式化器风格冲突产生反复 diff） */
const written = new Set<string>()

// ─── 工具函数 ─────────────────────────────────────

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
}

/** 填充 obj.version；check 模式仅记录漂移。label 用于日志 */
function applyVersion(
  file: string,
  obj: Record<string, any>,
  version: string,
  label: string,
): void {
  if (obj.version === version) return
  if (CHECK_ONLY) {
    drifts.push(`${label}: ${obj.version} → ${version}`)
    return
  }
  obj.version = version
  writeJson(file, obj)
  written.add(file)
  console.log(`  ✓ ${label} 版本已填充为 ${version}`)
}

/** 递归发现根目录下的 marketplace.json（深度 ≤ 3，跳过依赖与产物目录） */
function findMarketplaces(): string[] {
  const found: string[] = []
  const walk = (dir: string, depth: number): void => {
    if (depth > 3) return
    for (const entry of readdirSync(dir)) {
      if (['node_modules', 'vendor', 'dist', '.git'].includes(entry)) continue
      if (depth === 1 && entry === 'plugins') continue
      const full = join(dir, entry)
      let isDir = false
      try {
        isDir = statSync(full).isDirectory()
      } catch {
        continue
      }
      if (isDir) walk(full, depth + 1)
      else if (entry === 'marketplace.json') found.push(full)
    }
  }
  walk(REPO_ROOT, 1)
  return found
}

// ─── 主流程 ──────────────────────────────────────

async function main(): Promise<void> {
  const rootVersion: string = readJson(join(REPO_ROOT, 'package.json')).version
  console.log(`版本事实源 package.json: ${rootVersion}${CHECK_ONLY ? '（check 模式）' : ''}`)

  // 第一步：扫描插件并填充根 manifest 版本
  const pluginsDir = join(REPO_ROOT, 'plugins')
  const pluginRoots = readdirSync(pluginsDir)
    .map(name => join(pluginsDir, name))
    .filter(dir => {
      try {
        return statSync(dir).isDirectory() && existsSync(join(dir, 'plugin.json'))
      } catch {
        return false
      }
    })

  /** 插件名集合（marketplace 条目按 name 匹配） */
  const pluginNames = new Set<string>()
  for (const pluginRoot of pluginRoots) {
    const manifestPath = join(pluginRoot, 'plugin.json')
    const manifest = readJson(manifestPath)
    applyVersion(manifestPath, manifest, rootVersion, relative(REPO_ROOT, manifestPath))
    pluginNames.add(manifest.name)
  }

  // 第二步：调用各插件的厂商 init.ts（check 模式改为校验生成产物版本）
  for (const pluginRoot of pluginRoots) {
    const namespaces = readdirSync(pluginRoot).filter(
      d => d.startsWith('.') && existsSync(join(pluginRoot, d, 'init.ts')),
    )
    for (const ns of namespaces) {
      const label = relative(REPO_ROOT, join(pluginRoot, ns, 'plugin.json'))
      if (CHECK_ONLY) {
        const outPath = join(pluginRoot, ns, 'plugin.json')
        if (!existsSync(outPath)) {
          drifts.push(`${label}: 未生成（请先运行 init）`)
          continue
        }
        const out = readJson(outPath)
        if (out.version !== rootVersion) drifts.push(`${label}: ${out.version} → ${rootVersion}`)
        continue
      }
      const mod = await import(pathToFileURL(join(pluginRoot, ns, 'init.ts')).href)
      if (typeof mod.init !== 'function') {
        console.error(`  ✗ ${ns}/init.ts 未导出 init 函数，跳过`)
        continue
      }
      mod.init(pluginRoot)
      written.add(join(pluginRoot, ns, 'plugin.json'))
      // 厂商 init 可能额外生成 MCP 适配文件（如 mcp.codex.json）
      for (const extra of ['mcp.codex.json']) {
        const p = join(pluginRoot, extra)
        if (existsSync(p)) written.add(p)
      }
    }
  }

  // 第三步：同步 marketplace（仅填充已存在的 version 字段）
  for (const file of findMarketplaces()) {
    const rel = relative(REPO_ROOT, file)
    const data = readJson(file)
    let changed = false

    if (typeof data.metadata?.version === 'string' && data.metadata.version !== rootVersion) {
      if (CHECK_ONLY) {
        drifts.push(`${rel} metadata.version: ${data.metadata.version} → ${rootVersion}`)
      } else {
        data.metadata.version = rootVersion
        changed = true
      }
    }

    if (Array.isArray(data.plugins)) {
      for (const entry of data.plugins) {
        if (typeof entry?.version !== 'string') continue
        if (!pluginNames.has(entry.name)) {
          console.warn(`  ⚠ ${rel}: 插件 '${entry.name}' 不在 plugins/ 中，跳过`)
          continue
        }
        if (entry.version !== rootVersion) {
          if (CHECK_ONLY) {
            drifts.push(
              `${rel} plugins['${entry.name}'].version: ${entry.version} → ${rootVersion}`,
            )
          } else {
            entry.version = rootVersion
            changed = true
          }
        }
      }
    }

    if (changed) {
      writeJson(file, data)
      written.add(file)
      console.log(`  ✓ ${rel} 版本已同步`)
    }
  }

  // 收尾
  if (CHECK_ONLY) {
    if (drifts.length) {
      console.error(`✗ 版本漂移 ${drifts.length} 处：`)
      for (const d of drifts) console.error(`  - ${d}`)
      process.exit(1)
    }
    console.log('✓ 版本一致，无漂移')
  } else {
    // 写入内容的风格（数组恒多行）与 vp fmt（短数组单行）不同，
    // 统一过一遍 fmt，保证 init 产物即 fmt 终态，避免两者来回改写
    if (written.size) {
      // 单字符串命令 + 自行加引号：规避 args 数组与 shell 同用时 Node 只做拼接（DEP0190）
      const files = [...written].map(f => `"${relative(REPO_ROOT, f).replaceAll('\\', '/')}"`)
      const r = spawnSync(`vp fmt ${files.join(' ')}`, {
        stdio: 'inherit',
        shell: true,
      })
      if (r.status !== 0) process.exit(r.status ?? 1)
    }
    console.log('完成。')
  }
}

await main()
