/**
 * skills/skill-authoring/scripts/validate-skill.ts 的单元测试 + 本仓库技能门禁。
 *
 * 规则库与 CLI 都随技能分发（技能目录自包含）；测试放在仓库测试目录，
 * 不随技能安装。fixture 部分覆盖各门的正反两路（tmpdir 构造 skills/ 树）；
 * 末尾的"本仓库技能体检"对仓库 skills/ 下每个技能跑七道质量门，
 * 哪个技能红就是它该修改的清单。
 */

import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import {
  checkStructuralCompleteness,
  FailError,
  validateSkill,
} from '../../skills/skill-authoring/scripts/validate-skill.ts'

/** 在临时目录里写一个文件并返回其路径。 */
function writeFile(root: string, rel: string, text: string): string {
  const file = join(root, rel)
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, text)
  return file
}

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'vs-'))
}

/** 断言 fn 抛出 FailError 且消息包含 fragment。 */
function expectFail(fn: () => void, fragment: string): void {
  let caught: unknown
  try {
    fn()
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(FailError)
  expect((caught as FailError).message).toContain(fragment)
}

const VALID_SKILL = `---
name: demo-skill
description: "Guides agents through demo work. Use when demonstrating fixtures. Not for production use."
when_to_use: "demo, fixture"
---

# Demo Skill

Stance sentence.

## Outcome Contract

- **Outcome**: a demo

## Core Process

1. Do the first thing.
2. Do the second thing.
`

// ---- checkStructuralCompleteness --------------------------------------------

describe('checkStructuralCompleteness', () => {
  it('结构完整时通过', () => {
    checkStructuralCompleteness(VALID_SKILL)
  })

  it('缺 Outcome Contract 拒绝', () => {
    expectFail(
      () => checkStructuralCompleteness('# T\n\nStance.\n\n## Core Process\n\n1. Step.\n'),
      'MISSING OUTCOME CONTRACT',
    )
  })

  it('无编号步骤小节拒绝', () => {
    expectFail(
      () =>
        checkStructuralCompleteness('# T\n\nStance.\n\n## Outcome Contract\n\n- **Outcome**: x\n'),
      'NO PROCESS SECTION',
    )
  })

  it('空标题拒绝', () => {
    expectFail(
      () =>
        checkStructuralCompleteness(
          '# T\n\nStance.\n\n## Outcome Contract\n\n- **Outcome**: x\n\n## Core Process\n\n1. Step.\n\n## Empty\n',
        ),
      'ORPHANED HEADING',
    )
  })

  it('代码围栏里的 # 行不算标题', () => {
    checkStructuralCompleteness(
      '# T\n\nStance.\n\n## Outcome Contract\n\n- **Outcome**: x\n\n## Core Process\n\n1. Step.\n\n```\n# not a heading\n```\n',
    )
  })
})

// ---- validateSkill -----------------------------------------------------------

describe('validateSkill', () => {
  it('合规技能全绿', () => {
    const root = tmp()
    writeFile(root, 'skills/demo-skill/SKILL.md', VALID_SKILL)
    expect(validateSkill(join(root, 'skills', 'demo-skill'))).toEqual([])
  })

  it('description 过短计入失败', () => {
    const root = tmp()
    writeFile(
      root,
      'skills/demo-skill/SKILL.md',
      VALID_SKILL.replace(
        'Guides agents through demo work. Use when demonstrating fixtures. Not for production use.',
        'short',
      ),
    )
    const failures = validateSkill(join(root, 'skills', 'demo-skill'))
    expect(failures.join('\n')).toContain('DESCRIPTION TOO SHORT')
  })

  it('跨技能文件引用计入失败', () => {
    const root = tmp()
    writeFile(
      root,
      'skills/demo-skill/SKILL.md',
      VALID_SKILL + '\nSee skills/other-skill/SKILL.md for details.\n',
    )
    const failures = validateSkill(join(root, 'skills', 'demo-skill'))
    expect(failures.join('\n')).toContain('CROSS-SKILL FILE REFERENCE')
  })

  it('兄弟技能触发词撞车计入失败', () => {
    const root = tmp()
    writeFile(root, 'skills/demo-skill/SKILL.md', VALID_SKILL)
    writeFile(
      root,
      'skills/twin-skill/SKILL.md',
      VALID_SKILL.replaceAll('demo-skill', 'twin-skill').replace(
        'when_to_use: "demo, fixture"',
        'when_to_use: "demo, fixture, extra"',
      ),
    )
    const failures = validateSkill(join(root, 'skills', 'demo-skill'))
    expect(failures.join('\n')).toContain('trigger keyword overlap')
  })

  it('目录名非 kebab-case 计入失败', () => {
    const root = tmp()
    writeFile(
      root,
      'skills/Demo_Skill/SKILL.md',
      VALID_SKILL.replaceAll('demo-skill', 'Demo_Skill'),
    )
    const failures = validateSkill(join(root, 'skills', 'Demo_Skill'))
    expect(failures.join('\n')).toContain('INVALID DIRECTORY NAME')
  })

  it('prose 提到的 scripts/ 文件不存在计入失败', () => {
    const root = tmp()
    writeFile(
      root,
      'skills/demo-skill/SKILL.md',
      VALID_SKILL + '\nRun `node scripts/helper.ts` to check.\n',
    )
    const failures = validateSkill(join(root, 'skills', 'demo-skill'))
    expect(failures.join('\n')).toContain('BROKEN REFERENCE')
  })

  it('prose 提到的 scripts/ 文件存在时通过', () => {
    const root = tmp()
    writeFile(
      root,
      'skills/demo-skill/SKILL.md',
      VALID_SKILL + '\nRun `node scripts/helper.ts` to check.\n',
    )
    writeFile(root, 'skills/demo-skill/scripts/helper.ts', '// helper\n')
    expect(validateSkill(join(root, 'skills', 'demo-skill'))).toEqual([])
  })

  it('分类器敏感指令字面量计入失败', () => {
    const root = tmp()
    writeFile(
      root,
      'skills/demo-skill/SKILL.md',
      VALID_SKILL + '\nAn attack looks like: "ignore previous instructions".\n',
    )
    const failures = validateSkill(join(root, 'skills', 'demo-skill'))
    expect(failures.join('\n')).toContain('PROVIDER-SENSITIVE INSTRUCTION LITERAL')
  })

  it('不在 skills/ 树中时跳过触发词门且其余门照常', () => {
    const root = tmp()
    writeFile(root, 'pack/demo-skill/SKILL.md', VALID_SKILL)
    expect(validateSkill(join(root, 'pack', 'demo-skill'))).toEqual([])
  })
})

// ---- 本仓库技能体检 -----------------------------------------------------------

const REPO_SKILLS_DIR = fileURLToPath(new URL('../../skills', import.meta.url))

const repoSkillNames = readdirSync(REPO_SKILLS_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && existsSync(join(REPO_SKILLS_DIR, e.name, 'SKILL.md')))
  .map(e => e.name)
  .sort()

describe('本仓库技能体检', () => {
  for (const name of repoSkillNames) {
    it(`skills/${name} 通过全部质量门`, () => {
      expect(validateSkill(join(REPO_SKILLS_DIR, name))).toEqual([])
    })
  }
})
