#!/usr/bin/env tsx
/**
 * Qoder 插件卸载脚本（纯目录操作，无需 qodercli）
 *
 * 与 install.ts 对应：移除 ~/.qoder 与 ~/.qoder-cn 下
 * plugins/custom/<name>/ 副本及其 .<name>.bak 备份，并从
 * plugins/installed_plugins_v2.json 删除 <name>@local-custom 条目。
 * 市场渠道安装（cache/ 下 <name>@<marketplace> 条目）不受影响。
 *
 * 特性：
 *   - 双端适配：~/.qoder 与 ~/.qoder-cn 哪个存在清哪个；都不存在则报错退出
 *   - 幂等：重复运行结果一致，缺失项如实报告并跳过
 *   - 零依赖：仅 Node 原生 API
 *
 * 用法：
 *   tsx .qoder-plugin/uninstall.ts [插件目录]
 */

/// <reference types="node" />
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { findSameNameDirs, targetHomes } from './install'

function uninstallFromHome(qoderHome: string, name: string): void {
  const pluginsDir = join(qoderHome, 'plugins')
  const customDir = join(pluginsDir, 'custom')
  const target = join(customDir, name)
  const backupDir = join(customDir, `.${name}.bak`)

  // 第一步：移除安装副本与 install.ts 留下的原地备份
  for (const dir of [target, backupDir]) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
      console.log(`  ✓ 已移除 ${dir}`)
    } else {
      console.log(`  - 不存在，跳过 ${dir}`)
    }
  }

  // 第二步：从注册表删除 <name>@local-custom 条目
  const registryPath = join(pluginsDir, 'installed_plugins_v2.json')
  const key = `${name}@local-custom`
  if (existsSync(registryPath)) {
    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
    if (registry.plugins?.[key]) {
      delete registry.plugins[key]
      writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n')
      console.log(`  ✓ 注册表已删除:${key}`)
    } else {
      console.log(`  - 注册表无 ${key} 条目，跳过`)
    }
  } else {
    console.log(`  - 注册表不存在，跳过 ${registryPath}`)
  }

  // 第三步：提示 custom 下仍存在的同名插件目录
  for (const dir of findSameNameDirs(customDir, name)) {
    console.warn(`  ⚠ custom/${dir} 仍是 '${name}' 插件，请手动处理`)
  }
}

export function uninstall(pluginRoot: string): void {
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'plugin.json'), 'utf-8'))
  const name: string = manifest.name
  if (!name) {
    console.error('根 plugin.json 缺少 name')
    process.exit(1)
  }

  const homes = targetHomes()
  if (!homes.length) {
    console.error('未找到 ~/.qoder 或 ~/.qoder-cn 目录')
    process.exit(1)
  }
  for (const qoderHome of homes) {
    console.log(`[${qoderHome}]`)
    uninstallFromHome(qoderHome, name)
  }

  console.log(`完成。重启 Qoder 后 '${name}' 的本地安装项消失；市场渠道安装不受影响。`)
}

export default { uninstall }

if (process.argv[1] && basename(process.argv[1]) === 'uninstall.ts') {
  uninstall(resolve(process.argv[2] ?? '.'))
}
