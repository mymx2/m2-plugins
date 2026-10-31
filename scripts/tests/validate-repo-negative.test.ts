/**
 * validate_repo.py 的反证用例。
 *
 * 现有 validate-repo.test.ts 只断言“好仓库通过”。如果校验器对坏 manifest
 * 也返回 0，整条门就是假绿。这里用临时仓库写一个缺 name 的 plugin.json，
 * 断言退出码为 1 且错误信息指向 name。
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vite-plus/test'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const VALIDATE_REPO_PY = join(REPO_ROOT, 'scripts', 'validate_repo.py')

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'validate-repo-negative-'))
  dirs.push(dir)
  return dir
}

describe('validate_repo.py negative fixture', () => {
  it('缺少 name 的 plugin.json 必须退出 1', () => {
    const repo = tmp()
    const pluginDir = join(repo, 'plugins', 'bad')
    mkdirSync(pluginDir, { recursive: true })
    writeFileSync(
      join(pluginDir, 'plugin.json'),
      JSON.stringify({ $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json' }),
    )
    const result = spawnSync('python3', [VALIDATE_REPO_PY, repo], {
      encoding: 'utf-8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('name')
  })
})
