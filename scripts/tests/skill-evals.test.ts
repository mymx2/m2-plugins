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

function registeredCases(evalYaml: string): string[] {
  const block = evalYaml.match(/^\s{2}files:\n((?:\s{4}- .*\n)+)/m)?.[1] ?? ''
  return block
    .split('\n')
    .map(line => line.replace(/^\s{4}- /, '').trim())
    .filter(Boolean)
}

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
