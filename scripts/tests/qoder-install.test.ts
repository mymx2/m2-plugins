/**
 * Qoder 插件名校验的回归测试。
 *
 * install 与 uninstall 共用 validatePluginName；名称会参与路径拼接，
 * 校验既要符合 Agent Plugins 约束，也要挡住路径分隔符和空名。
 */

import { describe, expect, it } from 'vite-plus/test'
import { validatePluginName } from '../../plugins/dyc/.qoder-plugin/install'

describe('validatePluginName', () => {
  it('接受合法的 Agent Plugins 名称', () => {
    for (const name of ['dyc', 'my-plugin', 'a.b', 'a1', 'a'.repeat(64)]) {
      expect(validatePluginName(name), name).toBe(true)
    }
  })

  it('拒绝空名、大小写、路径分隔符和非法首尾', () => {
    for (const name of [
      '',
      'Dyc',
      '-dyc',
      'dyc-',
      '.dyc',
      'dyc.',
      'a--b',
      'a..b',
      'a_b',
      'dyc/x',
      'a'.repeat(65),
    ]) {
      expect(validatePluginName(name), name).toBe(false)
    }
  })
})
