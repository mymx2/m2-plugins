/**
 * Codex MCP 适配的回归测试。
 *
 * 标准源 mcp.json 的 Bearer ${VAR} headers 是唯一事实源：init 必须把它转成
 * bearer_token_env_var，并去掉 type/headers，避免凭据配置出现第二份映射。
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { writeCodexMcp } from '../../plugins/dyc/.codex-plugin/init'

const REPO_ROOT = join(__dirname, '..', '..')
const dirs: string[] = []

afterEach(() => {
  vi.restoreAllMocks()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('writeCodexMcp', () => {
  it('标准源 mcp.json 保留 context7/github 的 Bearer headers', () => {
    const mcp = JSON.parse(readFileSync(join(REPO_ROOT, 'plugins/dyc/mcp.json'), 'utf-8'))
    expect(mcp.mcpServers.context7.headers.Authorization).toBe('Bearer ${CONTEXT7_API_KEY}')
    expect(mcp.mcpServers.github.headers.Authorization).toBe(
      'Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}',
    )
  })

  it('把 Bearer ${VAR} headers 转为 bearer_token_env_var', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const dir = mkdtempSync(join(tmpdir(), 'codex-mcp-'))
    dirs.push(dir)
    writeFileSync(
      join(dir, 'mcp.json'),
      JSON.stringify({
        mcpServers: {
          context7: {
            type: 'streamable-http',
            url: 'https://mcp.context7.com/mcp',
            headers: { Authorization: 'Bearer ${CONTEXT7_API_KEY}' },
          },
          local: { type: 'stdio', command: 'npx', args: ['-y', 'example'] },
        },
      }),
    )

    writeCodexMcp(dir)

    const out = JSON.parse(readFileSync(join(dir, 'mcp.codex.json'), 'utf-8'))
    expect(out.mcp_servers.context7).toEqual({
      url: 'https://mcp.context7.com/mcp',
      bearer_token_env_var: 'CONTEXT7_API_KEY',
    })
    expect(out.mcp_servers.context7).not.toHaveProperty('headers')
    expect(out.mcp_servers.context7).not.toHaveProperty('type')
    expect(out.mcp_servers.local).toEqual({ command: 'npx', args: ['-y', 'example'] })
  })

  it('保留非 Bearer headers 并发出警告', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const dir = mkdtempSync(join(tmpdir(), 'codex-mcp-'))
    dirs.push(dir)
    writeFileSync(
      join(dir, 'mcp.json'),
      JSON.stringify({
        mcpServers: {
          custom: {
            type: 'http',
            url: 'https://example.com/mcp',
            headers: { 'X-API-Key': 'literal' },
          },
        },
      }),
    )

    writeCodexMcp(dir)

    const out = JSON.parse(readFileSync(join(dir, 'mcp.codex.json'), 'utf-8'))
    expect(out.mcp_servers.custom).toEqual({ url: 'https://example.com/mcp' })
    expect(out.mcp_servers.custom).not.toHaveProperty('headers')
    expect(warn).toHaveBeenCalled()
    expect(log).toHaveBeenCalled()
  })
})
