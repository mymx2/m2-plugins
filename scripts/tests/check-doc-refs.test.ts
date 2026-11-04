import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vite-plus/test'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const SCRIPT = join(REPO_ROOT, 'plugins/dyc/skills/health/scripts/check_doc_refs.py')
const dirs: string[] = []

function repoWithAgents(content: string): string {
  const root = mkdtempSync(join(tmpdir(), 'doc-refs-'))
  dirs.push(root)
  writeFileSync(join(root, 'AGENTS.md'), content, 'utf8')
  return root
}

function run(root: string): { status: number; output: string } {
  try {
    const output = execFileSync('python', [SCRIPT, root], {
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

describe('check_doc_refs inline code spans', () => {
  it('ignores references inside inline code spans', () => {
    const root = repoWithAgents(
      'Do not write `references/xxx.md` paths. Also ``references/yyy.md``.\n',
    )
    const result = run(root)
    expect(result.status).toBe(0)
    expect(result.output).toContain('doc references: ok')
  })

  it('ignores references inside fenced code blocks', () => {
    const root = repoWithAgents('```text\nreferences/xxx.md\n```\n')
    const result = run(root)
    expect(result.status).toBe(0)
    expect(result.output).toContain('doc references: ok')
  })

  it('still reports a bare missing reference', () => {
    const root = repoWithAgents('See references/missing.md for details.\n')
    const result = run(root)
    expect(result.status).toBe(1)
    expect(result.output).toContain('MISSING')
  })
})
