/**
 * skill-frontmatter.ts 的单元测试。
 *
 * 覆盖：happy path、每种契约违例的报错文案、触发词拆分、技能引用对比。
 * 写文件用系统临时目录，逐用例独立，互不污染。
 */

import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'
import {
  FailError,
  fail,
  parseFrontmatter,
  parseWhenToUseKeywords,
  skillRefDiff,
} from '../../skills/forge/scripts/skill-frontmatter.ts'

const GOOD = `---
name: example
description: "Does the thing. Not for the other thing."
when_to_use: "trigger1, trigger2, 中文触发"
---

# Example

body
`

/** 把一段 frontmatter 文本落到临时文件并返回路径。 */
function writeTmp(text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fm-'))
  const file = join(dir, 'SKILL.md')
  writeFileSync(file, text)
  return file
}

/** 断言解析抛出 FailError 且消息包含指定片段。 */
function expectFail(text: string, fragment: string): void {
  let caught: unknown
  try {
    parseFrontmatter(writeTmp(text))
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(FailError)
  expect((caught as FailError).message).toContain(fragment)
}

describe('parseFrontmatter', () => {
  it('happy path 解析全部字段', () => {
    const fields = parseFrontmatter(writeTmp(GOOD))
    expect(fields).toEqual({
      name: 'example',
      description: 'Does the thing. Not for the other thing.',
      when_to_use: 'trigger1, trigger2, 中文触发',
    })
  })

  it('支持单引号值与最小转义', () => {
    const fields = parseFrontmatter(
      writeTmp(GOOD.replace('"Does the thing. Not for the other thing."', "'it\\'s fine'")),
    )
    expect(fields.description).toBe("it's fine")
  })

  it('拒绝 dispatch_intent（不属于契约）', () => {
    expectFail(
      GOOD.replace('when_to_use:', 'dispatch_intent: "x"\nwhen_to_use:'),
      'STALE dispatch_intent',
    )
  })

  it('metadata 块合法且不校验内容', () => {
    const fields = parseFrontmatter(
      writeTmp(GOOD.replace('when_to_use:', 'metadata:\n  version: "1.0.0"\nwhen_to_use:')),
    )
    expect(fields.when_to_use).toBe('trigger1, trigger2, 中文触发')
  })

  it('拒绝缺失的起始分隔线', () => {
    expectFail('name: example\n', 'INVALID FRONTMATTER')
  })

  it('拒绝缺失的收尾分隔线', () => {
    expectFail('---\nname: example\n', 'missing closing ---')
  })

  it('拒绝缺失 name', () => {
    expectFail(GOOD.replace('name: example\n', ''), 'MISSING name')
  })

  it('拒绝缺失 description', () => {
    expectFail(
      GOOD.replace('description: "Does the thing. Not for the other thing."\n', ''),
      'MISSING description',
    )
  })

  it('拒绝空字段值', () => {
    expectFail(GOOD.replace('name: example', 'name:'), 'EMPTY FRONTMATTER VALUE')
  })

  it('拒绝未加引号的冒号值', () => {
    expectFail(
      GOOD.replace('"Does the thing. Not for the other thing."', 'foo: bar'),
      'UNQUOTED FRONTMATTER COLON',
    )
  })

  it('拒绝未闭合的引号', () => {
    expectFail(
      GOOD.replace('"Does the thing. Not for the other thing."', '"unterminated'),
      'INVALID FRONTMATTER QUOTE',
    )
  })

  it('支持块标量 description（> 折叠为单段）', () => {
    const fields = parseFrontmatter(
      writeTmp(
        GOOD.replace(
          'description: "Does the thing. Not for the other thing."',
          'description: >\n  第一行描述。\n  第二行描述。',
        ),
      ),
    )
    expect(fields.description).toBe('第一行描述。 第二行描述。')
  })

  it('块标量后紧跟其他字段继续正常解析', () => {
    const fields = parseFrontmatter(
      writeTmp(
        GOOD.replace(
          'description: "Does the thing. Not for the other thing."',
          'description: >\n  第一行。\n  第二行。',
        ),
      ),
    )
    expect(fields.description).toBe('第一行。 第二行。')
    expect(fields.when_to_use).toBe('trigger1, trigger2, 中文触发')
  })

  it('列表与自定义字段（license/triggers/tip）静默忽略', () => {
    const fields = parseFrontmatter(
      writeTmp(
        [
          '---',
          'name: example',
          'description: 中文描述。',
          'tip: 提醒。',
          'triggers:',
          "  - '生成报告'",
          "  - 'repowiki'",
          'license: MIT',
          '---',
        ].join('\n'),
      ),
    )
    expect(fields.name).toBe('example')
    expect(fields.description).toBe('中文描述。')
  })
})

describe('parseWhenToUseKeywords', () => {
  it('小写化、去重、去空白项', () => {
    expect(parseWhenToUseKeywords('Foo, FOO, bar, , 中文')).toEqual(new Set(['foo', 'bar', '中文']))
  })

  it('空串返回空集合', () => {
    expect(parseWhenToUseKeywords('')).toEqual(new Set())
  })
})

describe('skillRefDiff', () => {
  it('同时报告缺失引用与失效引用', () => {
    const [missing, stale] = skillRefDiff(
      'see skills/check/SKILL.md and skills/ghost/SKILL.md',
      new Set(['check', 'hunt']),
    )
    expect(missing).toEqual(['hunt'])
    expect(stale).toEqual(['ghost'])
  })

  it('同一技能被引用多次只计一次', () => {
    const [missing, stale] = skillRefDiff(
      'skills/check/SKILL.md then skills/check/SKILL.md again',
      new Set(['check']),
    )
    expect(missing).toEqual([])
    expect(stale).toEqual([])
  })
})

describe('fail', () => {
  it('抛出带原文消息的 FailError', () => {
    expect(() => fail('boom')).toThrow(FailError)
    expect(() => fail('boom')).toThrow('boom')
  })
})
