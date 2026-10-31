/**
 * incident_ledger.py 的行为测试。
 *
 * 事故台账是 check 的评审回归基准：脚本只做确定性校验，所以每条失败路径
 * 都要有一个会红的最小 fixture，避免“匹配不到任何东西也能通过”。
 * 覆盖：合法行、逐项缺陷、层声明与 --layers、重复 ID、缺失台账、回放计划、
 * shallow clone、测试声明识别（Python / JS / shell / Bats）与注释误报。
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vite-plus/test'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const SCRIPT = join(REPO_ROOT, 'plugins', 'dyc', 'skills', 'check', 'scripts', 'incident_ledger.py')

const HEADER =
  '| ID | Reported | Symptom | Introduced | Fixed | Layer | Caught by |\n' +
  '|---|---|---|---|---|---|---|\n'

const TEST_FILES = {
  'tests/test_parser.py': 'def test_parses_empty_input():\n    pass\n',
  'spec/cli.bats': '@test "rejects a missing flag" {\n  true\n}\n',
  'src/app.py': 'def helper_only_in_source():\n    pass\n',
  'scripts/gate.sh': 'exit 0\n',
}

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'incident-ledger-'))
  dirs.push(dir)
  return dir
}

function git(repo: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-C',
      repo,
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgSign=false',
      ...args,
    ],
    { encoding: 'utf-8' },
  ).trim()
}

function makeRepo(files: Record<string, string>): { repo: string; sha: string } {
  const repo = join(tmp(), 'repo')
  mkdirSync(repo)
  git(repo, '-c', 'init.defaultBranch=main', 'init', '-q')
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, rel)), { recursive: true })
    writeFileSync(join(repo, rel), body, 'utf-8')
  }
  git(repo, 'add', '-A')
  git(repo, 'commit', '-qm', 'fix')
  return { repo, sha: git(repo, 'rev-parse', '--short=8', 'HEAD') }
}

function writeLedger(repo: string, rows: string, preamble = ''): void {
  mkdirSync(join(repo, 'docs'), { recursive: true })
  writeFileSync(
    join(repo, 'docs', 'incidents.md'),
    `# Incidents\n\n${preamble}\n## Incidents\n\n${HEADER}${rows}`,
    'utf-8',
  )
}

interface RunResult {
  code: number
  stdout: string
  stderr: string
}

function run(repo: string, ...extra: string[]): RunResult {
  const result = spawnSync('python3', [SCRIPT, '--root', repo, ...extra], { encoding: 'utf-8' })
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

describe('incident_ledger.py', () => {
  it('合法台账通过，并接受标识符、测试标题与 gate 路径', () => {
    const { repo, sha } = makeRepo(TEST_FILES)
    writeLedger(
      repo,
      `| I-01 | 2026-01-02 | Crash on empty input | unknown | ${sha} | unit | \`test_parses_empty_input\`, \`rejects a missing flag\`, \`scripts/gate.sh\` |\n`,
    )
    const result = run(repo)
    expect(result.code).toBe(0)
    expect(result.stderr).toContain('1 rows, 0 problems')
  })

  const defects: Array<{ name: string; row: (sha: string) => string; expected: string }> = [
    {
      name: '未定义的 catcher',
      row: sha =>
        `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit | \`test_missing_everywhere\` |`,
      expected: 'catcher `test_missing_everywhere`',
    },
    {
      name: '源码函数不是测试声明',
      row: sha => `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit | \`helper_only_in_source\` |`,
      expected: 'catcher `helper_only_in_source`',
    },
    {
      name: 'Caught by 没有反引号',
      row: sha => `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit | no backticks |`,
      expected: 'no catcher named',
    },
    {
      name: 'Fixed 无法解析',
      row: () =>
        '| I-01 | 2026-01-02 | s | unknown | deadbeef | unit | `test_parses_empty_input` |',
      expected: 'Fixed deadbeef does not resolve',
    },
    {
      name: 'Introduced 不是 commit',
      row: sha =>
        `| I-01 | 2026-01-02 | s | someone | ${sha} | unit | \`test_parses_empty_input\` |`,
      expected: 'Introduced is not a commit',
    },
    {
      name: '未知 layer',
      row: sha =>
        `| I-01 | 2026-01-02 | s | unknown | ${sha} | luck | \`test_parses_empty_input\` |`,
      expected: 'layer luck is not one of',
    },
    {
      name: 'Reported 不是日期',
      row: sha =>
        `| I-01 | yesterday | s | unknown | ${sha} | unit | \`test_parses_empty_input\` |`,
      expected: 'Reported is not a date',
    },
    {
      name: '列数不足',
      row: sha => `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit |`,
      expected: 'expected 7 cells',
    },
  ]

  for (const defect of defects) {
    it(`拒绝：${defect.name}`, () => {
      const { repo, sha } = makeRepo(TEST_FILES)
      writeLedger(repo, defect.row(sha) + '\n')
      const result = run(repo)
      expect(result.code).toBe(1)
      expect(result.stdout).toContain(defect.expected)
    })
  }

  it('拒绝重复 ID', () => {
    const { repo, sha } = makeRepo(TEST_FILES)
    const row = `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit | \`test_parses_empty_input\` |\n`
    writeLedger(repo, row + row)
    const result = run(repo)
    expect(result.code).toBe(1)
    expect(result.stdout).toContain('I-01 repeats')
  })

  it('layer 来自声明注释，--layers 可以覆盖', () => {
    const { repo, sha } = makeRepo(TEST_FILES)
    const preamble =
      'Layers, earliest first: `write-time` then `vm`.\n<!-- layers: write-time, vm -->\n'
    writeLedger(
      repo,
      `| I-01 | 2026-01-02 | s | unknown | ${sha} | vm | \`test_parses_empty_input\` |\n`,
      preamble,
    )
    expect(run(repo).code).toBe(0)
    expect(run(repo, '--layers', 'unit,native').code).toBe(1)
  })

  it('--plan 输出修复前版本与改动文件', () => {
    const { repo, sha } = makeRepo(TEST_FILES)
    writeLedger(
      repo,
      `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit | \`test_parses_empty_input\` |\n`,
    )
    const result = run(repo, '--plan')
    expect(result.code).toBe(0)
    expect(result.stdout).toContain(`I-01: review ${sha}^ files:`)
    expect(result.stdout).toContain('src/app.py')
  })

  it('缺失台账返回 usage error', () => {
    const { repo } = makeRepo(TEST_FILES)
    const result = run(repo)
    expect(result.code).toBe(2)
    expect(result.stderr).toContain('not found')
  })

  it('shallow clone 只做 shape check 并明确说明', () => {
    const { repo } = makeRepo(TEST_FILES)
    writeLedger(
      repo,
      '| I-01 | 2026-01-02 | s | unknown | 1234567 | unit | `test_parses_empty_input` |\n',
    )
    git(repo, 'add', '-A')
    git(repo, 'commit', '-qm', 'ledger')
    const clone = join(tmp(), 'clone')
    execFileSync('git', ['clone', '-q', '--depth', '1', `file://${repo}`, clone], {
      encoding: 'utf-8',
    })
    const result = run(clone)
    expect(result.code).toBe(0)
    expect(result.stderr).toContain('shallow clone')
  })

  it('识别 Python、JS、shell 与 Bats 的声明形式', () => {
    const { repo, sha } = makeRepo({
      'tests/test_async.py': 'async def test_async():\n    pass\n',
      'tests/test_js.js': 'it("rejects a missing flag", () => {});\n',
      'tests/test_arrow.ts': 'const test_arrow = () => {};\n',
      'tests/test_shell.sh': 'test_shell() {\n true\n}\n',
    })
    writeLedger(
      repo,
      `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit | \`test_async\`, \`rejects a missing flag\`, \`test_arrow\`, \`test_shell\` |\n`,
    )
    expect(run(repo).code).toBe(0)
  })

  it('注释与字符串里的测试名不算声明', () => {
    const { repo, sha } = makeRepo({
      'tests/test_js.js':
        '/*\nit("fake title", () => {});\n*/\nconst text = `\nfunction test_fake() {}\n`;\n',
      'tests/test_shell.sh': '# test_fake() {\ntrue\n',
      'tests/other.rs': '// fn test_fake() {}\n',
    })
    writeLedger(
      repo,
      `| I-01 | 2026-01-02 | s | unknown | ${sha} | unit | \`fake title\`, \`test_fake\` |\n`,
    )
    expect(run(repo).code).toBe(1)
  })
})
