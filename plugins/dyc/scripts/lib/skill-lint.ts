/**
 * skill-lint.ts — 跨厂商共享的技能校验规则
 *
 * 提炼自 addyosmani/agent-skills/scripts/lib/skill-lint.js 和 docs/skill-anatomy.md。
 * 被 .claude-plugin/init.ts 和 .codex-plugin/init.ts 引用。
 *
 * 设计原则：
 *   - 纯函数，无文件系统访问（由调用方传入 content）
 *   - 返回 errors（阻断）和 warnings（提示）
 *   - 所有规则来自真实项目校验经验，非理论推导
 */

// ─── 约束常量 ─────────────────────────────────────────────────────────────

/** skill description 硬性上限（字符）。addyosmani 定为 1024，因为 description 注入 system prompt */
export const MAX_DESCRIPTION_LENGTH = 1024

/** 目录名必须是 kebab-case */
export const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * description 必须包含 "when to use" 触发词。
 * 接受 "Use when ..."、"Use before/after/during ..." 等句式。
 * 拒绝否定形式 "Do not use when ..." —— 那描述的是排除条件，不是触发条件。
 */
const DESCRIPTION_TRIGGER = /\buse (this )?when\b|\buse (before|after|during)\b/i
const DESCRIPTION_TRIGGER_NEGATE =
  /\b(do not|don't|never) use (this )?(when|before|after|during)\b/i

/**
 * SKILL.md 推荐包含的 section。
 * 每个条目是一组可接受的标题别名——第一个匹配即可。
 * 这些是 addyosmani/agent-skills 从大量实践中提炼的标准骨架。
 */
export const REQUIRED_SECTIONS = [
  ['## Overview'],
  ['## When to Use'],
  ['## Common Rationalizations'],
  ['## Red Flags'],
  ['## Verification'],
]

/**
 * section 豁免白名单——validator 维护，不允许 skill 自行声明豁免。
 * 每个条目必须有文档化理由。
 */
export const SECTION_EXEMPT_SKILLS: Record<string, string> = {
  // 示例：'using-agent-skills': 'Meta-skill，编排其他技能，标准 section 不适用',
  check:
    'e7657ac 刻意精简：该 skill 的 Common Rationalizations 行均为 Hard Stops/Autofix/drift 段的复述，' +
    '上下文预算不通过而整节删除；Red Flags、Verification 等其余 section 齐全',
  health:
    'e7657ac 刻意精简：该 skill 的 Common Rationalizations 行复述 Budget posture 与 Step 0 证据类，' +
    '上下文预算不通过而整节删除；补齐会与正文规则重复',
}

/** SKILL.md 推荐行数上限。超过则应将详细内容拆到 references/ */
export const MAX_SKILL_LINES = 500

/** 跨技能引用模式——匹配显式引用其他技能的文本 */
const SKILL_REF_PATTERNS = [
  /\buse the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\bfollow the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\binvoke the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\bcontinue with `([a-z][a-z0-9-]+[a-z0-9])`/g,
  /\buse `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /`([a-z][a-z0-9-]+[a-z0-9])` skill\b/g,
  /`([a-z][a-z0-9-]+[a-z0-9])` persona\b/g,
  /\bsee `([a-z][a-z0-9-]+[a-z0-9])`/g,
  /──→ ([a-z][a-z0-9-]+[a-z0-9])\b/g,
  /→ `([a-z][a-z0-9-]+[a-z0-9])`/g,
]

// ─── 工具函数 ─────────────────────────────────────────────────────────────

/** 去除 fenced code blocks，避免代码示例中的 heading/reference 被误匹配 */
export function stripFencedCodeBlocks(content: string): string {
  return content.replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '')
}

/** 从 Markdown 头部提取 YAML frontmatter 字段 */
export function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n/)
  if (!match) return null

  const result: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line
      .slice(colonIdx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    if (key) result[key] = value
  }
  return result
}

/** 收集内容中的跨技能引用 */
export function extractSkillReferences(content: string): Set<string> {
  const refs = new Set<string>()
  for (const pattern of SKILL_REF_PATTERNS) {
    pattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pattern.exec(content)) !== null) {
      refs.add(m[1])
    }
  }
  return refs
}

// ─── 校验器 ───────────────────────────────────────────────────────────────

export interface LintResult {
  errors: string[]
  warnings: string[]
  exempt: boolean
}

/**
 * 校验 SKILL.md 内容（纯函数，不访问文件系统）。
 *
 * @param dirName     技能目录名（如 "code-review"）
 * @param content     SKILL.md 文件内容
 * @param knownSkills 已知的技能目录名集合（用于死链检测）
 */
export function lintSkillContent(
  dirName: string,
  content: string,
  knownSkills: Set<string>,
): LintResult {
  const errors: string[] = []
  const warnings: string[] = []

  // ── Frontmatter ──
  const fm = parseFrontmatter(content)
  if (!fm) {
    errors.push('缺少或格式错误的 YAML frontmatter（文件顶部应有 --- 块）')
    return { errors, warnings, exempt: false }
  }

  // name 字段
  if (!fm.name) {
    errors.push("frontmatter 缺少必填字段: 'name'")
  } else if (fm.name !== dirName) {
    errors.push(`frontmatter name '${fm.name}' 与目录名 '${dirName}' 不匹配`)
  }

  // 目录名 kebab-case
  if (!KEBAB_CASE.test(dirName)) {
    errors.push(`目录名 '${dirName}' 不是 kebab-case（应为 lowercase-hyphen-separated）`)
  }

  // description 字段
  if (!fm.description) {
    errors.push("frontmatter 缺少必填字段: 'description'")
  } else {
    // 长度检查
    if (fm.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(
        `description ${fm.description.length} 字符，超过 ${MAX_DESCRIPTION_LENGTH} 上限` +
          `（description 注入 system prompt，必须精炼）`,
      )
    }

    // "Use when..." 触发词检查
    const hasTrigger = DESCRIPTION_TRIGGER.test(fm.description)
    const onlyNegated =
      hasTrigger &&
      DESCRIPTION_TRIGGER_NEGATE.test(fm.description) &&
      !fm.description.replace(DESCRIPTION_TRIGGER_NEGATE, '').match(DESCRIPTION_TRIGGER)
    if (!hasTrigger || onlyNegated) {
      errors.push(
        `description 缺少 'when to use' 触发词——添加 "Use when ..." 句式` +
          `（description 必须同时说明技能做什么和何时使用）`,
      )
    }
  }

  // ── 行数检查（warning） ──
  const lineCount = content.split('\n').length
  if (lineCount > MAX_SKILL_LINES) {
    warnings.push(
      `SKILL.md ${lineCount} 行，建议 ≤ ${MAX_SKILL_LINES}（详细内容应拆到 references/）`,
    )
  }

  // ── 豁免守卫 ──
  // 如果 frontmatter 声明 type: meta 或 exempt: sections，但不在白名单中 → 报错
  if (fm.type === 'meta' || fm.exempt === 'sections') {
    if (!Object.hasOwn(SECTION_EXEMPT_SKILLS, dirName)) {
      errors.push(
        `frontmatter 声明 'type: meta' 或 'exempt: sections'，但 '${dirName}' 不在 ` +
          `SECTION_EXEMPT_SKILLS 白名单中。请在 scripts/lib/skill-lint.ts 中添加豁免条目并注明理由。`,
      )
    }
  }

  const isExempt = Object.hasOwn(SECTION_EXEMPT_SKILLS, dirName)

  // ── 必需 section 检查（豁免技能跳过） ──
  const proseContent = stripFencedCodeBlocks(content)
  if (!isExempt) {
    for (const aliases of REQUIRED_SECTIONS) {
      const found = aliases.some(heading => {
        const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        return new RegExp(`^${escaped}\\s*$`, 'm').test(proseContent)
      })
      if (!found) {
        warnings.push(`缺少推荐 section: ${aliases[0]}`)
      }
    }
  }

  // ── 跨技能引用死链检查 ──
  const refs = extractSkillReferences(content)
  for (const ref of refs) {
    if (!knownSkills.has(ref)) {
      warnings.push(`死链: \`${ref}\` 不是已知技能`)
    }
  }

  return { errors, warnings, exempt: isExempt }
}

/**
 * 校验 references/ 链接是否可解析。
 *
 * @param content    SKILL.md 文件内容
 * @param resolveRef 将相对路径解析为绝对路径的函数
 */
export function lintReferenceLinks(
  content: string,
  resolveRef: (relPath: string) => boolean,
): string[] {
  const warnings: string[] = []
  const REFERENCE_LINK_RE = /(?<![A-Za-z0-9._/-])((?:\.\.\/)*references\/[A-Za-z0-9._-]+\.md)/g

  for (const match of content.matchAll(REFERENCE_LINK_RE)) {
    const link = match[1]
    if (!resolveRef(link)) {
      warnings.push(`references/ 链接无法解析: ${link}`)
    }
  }

  return warnings
}
