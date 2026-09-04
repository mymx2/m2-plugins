/**
 * 仓库级结构验证 — 在 vp test 中统一执行。
 *
 * 将原来分散在 CI workflow 中的验证步骤收归测试文件：
 *   1. validate_repo.py（Python）— Agent Plugins Spec v1.0.0 仓库结构验证
 *      清单字段、名称规则、author/keywords、禁止文件、组件路由、
 *      技能深度检查（frontmatter + 重复名）、MCP 服务器类型级验证。
 *   2. validate-plugin.ts（TypeScript）— forge 插件级 7 门校验
 *      manifest 存在性、$schema、name、未知字段、extensions、init 脚本、mcp 一致性。
 *
 * 设计原则：
 *   - 验证逻辑的唯一来源是 validate_repo.py 和 validate-plugin.ts。
 *   - 本文件只做调用 + assert，不重复实现任何规则。
 *   - validate_repo.py 走 spawn（Python 无法进程内调用）；
 *     validate-plugin.ts 直接 import（零依赖纯函数，避免 npx 从 registry
 *     下载 tsx 导致的 CI 网络抖动超时，见 spawnSync npx ETIMEDOUT 事故）。
 *   - 失败时输出完整 stderr/stdout 或 failures 列表，方便定位具体哪个门红了。
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

import { validatePlugin } from '../../plugins/dyc/skills/forge/scripts/validate-plugin'

// ── 路径常量 ──────────────────────────────────────────────────────────────

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const PLUGINS_DIR = join(REPO_ROOT, 'plugins')
const VALIDATE_REPO_PY = join(REPO_ROOT, 'scripts', 'validate_repo.py')

// ── 发现插件 ──────────────────────────────────────────────────────────────

function discoverPlugins(): string[] {
  if (!existsSync(PLUGINS_DIR)) return []
  return readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.endsWith('-example'))
    .map(e => e.name)
    .sort()
}

const pluginNames = discoverPlugins()

/** spawn python 时强制 UTF-8，避免 Windows GBK 乱码 */
const PY_ENV = { ...process.env, PYTHONIOENCODING: 'utf-8' }

// ── 1. 仓库级验证（Python） ──────────────────────────────────────────────

describe('validate_repo.py — 仓库结构验证', () => {
  it('全量验证通过', () => {
    const stdout = execFileSync('python', [VALIDATE_REPO_PY, REPO_ROOT], {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
      timeout: 60_000,
      env: PY_ENV,
    })
    expect(stdout).toContain('通过')
  })

  it('--json 输出合法且 ok=true', () => {
    const stdout = execFileSync('python', [VALIDATE_REPO_PY, REPO_ROOT, '--json'], {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
      timeout: 60_000,
      env: PY_ENV,
    })
    const result = JSON.parse(stdout) as { ok: boolean; issues: { level: string }[] }
    expect(result.ok).toBe(true)
    // warnings 允许存在，只断言无 errors
    const errors = result.issues.filter(i => i.level === 'error')
    expect(errors).toEqual([])
  })

  for (const name of pluginNames) {
    it(`插件 ${name} 结构验证通过`, () => {
      execFileSync('python', [VALIDATE_REPO_PY, REPO_ROOT, '-p', name], {
        encoding: 'utf-8',
        cwd: REPO_ROOT,
        timeout: 30_000,
        env: PY_ENV,
      })
    })
  }
})

// ── 2. forge 插件级 7 门校验（TypeScript） ────────────────────────────────

describe('validate-plugin.ts — forge 插件门', () => {
  for (const name of pluginNames) {
    const pluginRoot = join(PLUGINS_DIR, name)

    it(`${name} 7 门全绿`, () => {
      const failures = validatePlugin(pluginRoot)
      expect(failures, failures.join('\n\n')).toEqual([])
    })
  }
})
