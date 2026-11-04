import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vite-plus/test'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const SCRIPT = join(REPO_ROOT, 'plugins/dyc/skills/health/scripts/check_maintainability.py')
const dirs: string[] = []

function failingRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'maint-fail-'))
  dirs.push(root)
  writeFileSync(join(root, 'AGENTS.md'), 'See references/missing.md for details.\n', 'utf8')
  return root
}

function run(root: string, extra: string[]): { status: number; output: string } {
  try {
    const output = execFileSync('python', [SCRIPT, root, 'summary', ...extra], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    return { status: 0, output }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` }
  }
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('check_maintainability fail-on-fail', () => {
  it('keeps report-only exit 0 by default', () => {
    const result = run(failingRepo(), [])
    expect(result.status).toBe(0)
    expect(result.output).toContain('maintainability_status: FAIL')
  })

  it('exits 1 only when --fail-on-fail is set', () => {
    const result = run(failingRepo(), ['--fail-on-fail'])
    expect(result.status).toBe(1)
    expect(result.output).toContain('maintainability_status: FAIL')
  })
})
