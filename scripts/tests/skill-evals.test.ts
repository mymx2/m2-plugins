/**
 * skill-up 评测登记门：每个技能都要有 eval.yaml，每个 case 都要登记，
 * 且 case 的 id 与文件名一致。没有这道门时，新增 case 漏登记或整目录
 * 缺失都不会让 CI 变红。
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const SKILLS_DIR = join(__dirname, '..', '..', 'plugins', 'dyc', 'skills')

function skillDirs(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter(name => {
      const dir = join(SKILLS_DIR, name)
      return statSync(dir).isDirectory() && !name.endsWith('-workspace')
    })
    .sort()
}

export function registeredCases(evalYaml: string): string[] {
  const lines = evalYaml.split(/\r?\n/)
  const start = lines.findIndex(line => /^\s*files:\s*$/.test(line))
  if (start === -1) return []
  const indent = lines[start].match(/^\s*/)![0].length
  const files: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) continue
    const lineIndent = line.match(/^\s*/)![0].length
    if (lineIndent <= indent) break
    const item = line.match(/^\s*-\s+(.+?)\s*$/)
    if (item) files.push(item[1].replace(/^['"]|['"]$/g, ''))
  }
  return files
}

describe('registeredCases parser', () => {
  it('accepts variable indentation', () => {
    const yaml =
      'cases:\n  files:\n    - evals/cases/a.yaml\n    - "evals/cases/b.yaml"\n  defaults:{}\n'
    expect(registeredCases(yaml)).toEqual(['evals/cases/a.yaml', 'evals/cases/b.yaml'])
  })

  it('accepts deeper indentation and stops at the next key', () => {
    const yaml = 'cases:\n    files:\n        - evals/cases/a.yaml\n    defaults: {}\n'
    expect(registeredCases(yaml)).toEqual(['evals/cases/a.yaml'])
  })

  it('returns an empty list when files: is absent', () => {
    expect(registeredCases('cases:\n  defaults: {}\n')).toEqual([])
  })
})

describe('skill-up eval registration', () => {
  it('技能目录不低于 12 个（整目录被删会红）', () => {
    expect(skillDirs().length).toBeGreaterThanOrEqual(12)
  })

  for (const skill of skillDirs()) {
    it(`${skill} 有 eval.yaml，case 已登记且 id 与文件名一致`, () => {
      const evalPath = join(SKILLS_DIR, skill, 'evals', 'eval.yaml')
      expect(existsSync(evalPath), `missing ${skill}/evals/eval.yaml`).toBe(true)
      const yaml = readFileSync(evalPath, 'utf-8')
      const listed = registeredCases(yaml)
      expect(listed.length, `${skill} has no cases.files entries`).toBeGreaterThan(0)

      const casesDir = join(SKILLS_DIR, skill, 'evals', 'cases')
      const caseFiles = existsSync(casesDir)
        ? readdirSync(casesDir)
            .filter(name => name.endsWith('.yaml'))
            .sort()
        : []
      expect(caseFiles.length, `${skill} has no case files`).toBeGreaterThan(0)

      for (const rel of listed) {
        expect(existsSync(join(SKILLS_DIR, skill, rel)), `${skill} lists missing ${rel}`).toBe(true)
      }
      for (const file of caseFiles) {
        const rel = `evals/cases/${file}`
        expect(listed, `${skill} does not register ${rel}`).toContain(rel)
        const id = readFileSync(join(casesDir, file), 'utf-8')
          .match(/^\s*id:\s*(.+)$/m)?.[1]
          ?.trim()
        expect(id, `${rel} has no id`).toBe(file.replace(/\.yaml$/, ''))
      }
    })
  }
})
