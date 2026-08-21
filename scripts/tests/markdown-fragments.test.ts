/**
 * markdown-fragments.ts 的单元测试。
 *
 * 覆盖：ATX/Setext 标题、重名碰撞后缀、行内标记剥除、实体反转义、
 * CJK 保留、代码围栏与缩进代码排除、块引用边界。
 */

import { describe, expect, it } from 'vite-plus/test'
import {
  githubHeadingInventory,
  githubHeadingRecords,
} from '../../skills/forge/scripts/markdown-fragments.ts'

describe('githubHeadingInventory', () => {
  it('按 GitHub 规则处理渲染文本与重名碰撞', () => {
    const markdown = `
# [Install](https://example.com)

<code>API</code> Guide
----------------------

# Foo
# Foo
# Foo-1

> # Quoted heading

# <https://example.com>

Multi
line
heading
===
`
    const { anchors, baseCounts } = githubHeadingInventory(markdown)
    expect(anchors).toEqual(
      new Set([
        'install',
        'api-guide',
        'foo',
        'foo-1',
        'foo-1-1',
        'quoted-heading',
        'httpsexamplecom',
        'multilineheading',
      ]),
    )
    expect(baseCounts.get('foo')).toBe(2)
  })

  it('代码围栏与缩进代码里的 # 行不是标题', () => {
    const markdown = `
\`\`\`text
\`\`\`still code
# Not a heading
\`\`\`

~~~
# Tilde fence, not a heading
~~~

    # indented code, not a heading
`
    const { anchors } = githubHeadingInventory(markdown)
    expect(anchors.size).toBe(0)
  })

  it('剥离行内 code / 链接 / HTML 标签并反转义实体', () => {
    const { anchors } = githubHeadingInventory('# `code` and **bold** &lt;tag&gt;\n')
    expect(anchors).toEqual(new Set(['code-and-bold-tag']))
  })

  it('CJK 标题保留原字符', () => {
    const { anchors } = githubHeadingInventory('## 中文标题 &amp; 实体\n')
    expect(anchors).toEqual(new Set(['中文标题--实体']))
  })

  it('纯标点标题不产生锚点', () => {
    const { anchors, baseCounts } = githubHeadingInventory('# !!!\n\n# Real\n')
    expect(anchors).toEqual(new Set(['real']))
    expect(baseCounts.size).toBe(1)
  })

  it('保留 emoji 变体选择符 U+FE0F（对齐 GitHub slugger）', () => {
    const { anchors } = githubHeadingInventory('## 🏗️ 构建与依赖管理\n')
    expect(anchors).toEqual(new Set(['\uFE0F-构建与依赖管理']))
  })

  it('下划线与连字符在锚点中保留', () => {
    const { anchors } = githubHeadingInventory('# Foo_Bar-baz!\n')
    expect(anchors).toEqual(new Set(['foo_bar-baz']))
  })
})

describe('githubHeadingRecords', () => {
  it('返回锚点对应的来源行号', () => {
    const records = githubHeadingRecords('# First\n\n# Second\n')
    expect(records).toEqual([
      ['first', 1],
      ['second', 3],
    ])
  })

  it('引用深度变化即新段落，不跨边界拼 Setext', () => {
    const markdown = '> quoted line\n---\n'
    // `---` 前是块引用段落，引用深度不同，不构成 Setext 标题
    expect(githubHeadingRecords(markdown)).toEqual([])
  })
})
