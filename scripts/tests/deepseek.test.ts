/**
 * read 技能 DeepSeek 可选层的回归测试。
 *
 * 只测不联网的契约：没有密钥时脚本在发送任何请求前退出；
 * API 返回 null 元数据时渲染器不崩溃，也不把 null 当分数输出。
 */

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const SCRIPT_DIR = join(REPO_ROOT, 'plugins', 'dyc', 'skills', 'read', 'scripts')
const SCRIPT = join(SCRIPT_DIR, 'deepseek.py')

describe('deepseek.py', () => {
  it('没有 DEEPSEEK_API_KEY 时退出 2 且不发送请求', () => {
    const env = { ...process.env }
    delete env.DEEPSEEK_API_KEY
    const result = spawnSync('python3', [SCRIPT, 'search', 'mole'], {
      encoding: 'utf-8',
      env: { ...env, PYTHONDONTWRITEBYTECODE: '1' },
    })
    expect(result.status).toBe(2)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('status=skip')
  })

  it('authority 与 score 为 null 时正常渲染，不崩溃也不输出 null', () => {
    const code = [
      'from deepseek import render_search',
      'print(render_search([{"title": "Page", "url": "https://example.com", "authority": None, "rerank_score": None}]))',
    ].join('\n')
    const result = spawnSync('python3', ['-c', code], {
      encoding: 'utf-8',
      env: { ...process.env, PYTHONPATH: SCRIPT_DIR, PYTHONDONTWRITEBYTECODE: '1' },
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Page')
    expect(result.stdout).toContain('https://example.com')
    expect(result.stdout).not.toContain('authority')
    expect(result.stdout).not.toContain('score')
  })
})
