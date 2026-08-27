#!/usr/bin/env tsx
/**
 * Qoder 插件初始化脚本
 *
 * 将标准 Agent Plugins Spec 的 plugin.json 适配为 Qoder 格式。
 * 逻辑：标准字段为底，extensions['.qoder-plugin'] 数据覆盖上去，写入。
 *
 * 用法：
 *   tsx .qoder-plugin/init.ts [插件目录]
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const NAMESPACE = '.qoder-plugin'

export function init(pluginRoot: string): void {
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'plugin.json'), 'utf-8'))
  const ext = manifest.extensions?.[NAMESPACE]
  if (!ext) {
    console.error(`未找到 extensions['${NAMESPACE}']，跳过`)
    return
  }

  // 合并：标准字段打底，厂商字段覆盖
  // init 字段是构建期约定（指向本脚本），不是 Qoder 官方清单字段，从产物中剔除
  const { extensions: _extensions, $schema: _$schema, ...base } = manifest
  const { init: _init, ...vendor } = ext
  const output = { ...base, ...vendor }

  // 写入
  const outputDir = join(pluginRoot, NAMESPACE)
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, 'plugin.json'), JSON.stringify(output, null, 2) + '\n')
  console.log(`✓ ${NAMESPACE}/plugin.json 已生成`)
}

export default { init }

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  init(resolve(process.argv[2] ?? '.'))
}
