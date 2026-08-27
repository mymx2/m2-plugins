#!/usr/bin/env tsx
/**
 * Qoder 插件安装脚本（纯目录操作，无需 qodercli）
 *
 * 将插件复制到 ~/.qoder/plugins/custom/<name>/ 并在
 * ~/.qoder/plugins/installed_plugins_v2.json 中注册 <name>@local-custom 条目。
 * 若 ~/.qoder-cn 存在（Qoder CN)，同步安装一份。
 * Qoder 重启后即可在插件面板看到并启用。
 *
 * 特性：
 *   - 双端适配：~/.qoder 与 ~/.qoder-cn 哪个存在装哪个，都存在则双端同步，
 *     仅装 Qoder CN 的机器也能正常安装；都不存在则报错退出
 *   - 原地备份：旧版重命名为 custom/.<name>.bak（点前缀，Qoder 不扫描）,
 *     只保留一个旧版；拷贝失败自动从备份回滚
 *   - 幂等：重复运行结果一致，注册表 installedAt 保留、lastUpdated 更新
 *   - 零依赖：仅 Node 原生 API
 *   - 排除其他厂商的适配产物（.claude-plugin/、.codebuddy-plugin/、
 *     .codex-plugin/、mcp.codex.json 均不在 INCLUDE 白名单内）
 *
 * 用法：
 *   tsx .qoder-plugin/install.ts [插件目录]
 */

/// <reference types="node" />
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/** 需要复制到 custom 目录的条目（不存在则跳过） */
const INCLUDE = [
  '.qoder-plugin',
  'LICENSE',
  'README.md',
  'README_CN.md',
  'mcp.json',
  'plugin.json',
  'rules',
  'scripts',
  'skills',
]

/** 目标 Qoder 主目录：哪个存在装哪个（支持仅装国际版或仅装 CN 的机器） */
function targetHomes(): string[] {
  const home = homedir()
  return [join(home, '.qoder'), join(home, '.qoder-cn')].filter(existsSync)
}

function installToHome(qoderHome: string, pluginRoot: string, name: string, version: string): void {
  const pluginsDir = join(qoderHome, 'plugins')
  const customDir = join(pluginsDir, 'custom')
  const target = join(customDir, name)
  const backupDir = join(customDir, `.${name}.bak`)

  // 第一步：读取旧安装版本（仅用于日志）
  let oldVersion: string | undefined
  try {
    oldVersion = JSON.parse(readFileSync(join(target, 'plugin.json'), 'utf-8')).version
  } catch {
    // 无旧安装
  }

  // 第二步：原地备份旧版（有且只留一个）
  const hadOld = existsSync(target)
  if (hadOld) {
    rmSync(backupDir, { recursive: true, force: true })
    renameSync(target, backupDir)
    console.log(`  ✓ 旧版${oldVersion ? ` v${oldVersion}` : ''}已备份到 ${backupDir}`)
  }

  // 第三步：安装新版（失败自动回滚）
  mkdirSync(target, { recursive: true })
  try {
    for (const item of INCLUDE) {
      const src = join(pluginRoot, item)
      if (existsSync(src)) {
        cpSync(src, join(target, item), { recursive: true })
      }
    }
  } catch (err) {
    rmSync(target, { recursive: true, force: true })
    if (hadOld) renameSync(backupDir, target)
    console.error('  ✗ 拷贝失败，已从备份回滚')
    throw err
  }
  console.log(`  ✓ 已安装 v${version} 到 ${target}`)

  // 第四步：注册到 installed_plugins_v2.json
  const registryPath = join(pluginsDir, 'installed_plugins_v2.json')
  const registry = existsSync(registryPath)
    ? JSON.parse(readFileSync(registryPath, 'utf-8'))
    : { version: 2, plugins: {} }
  registry.plugins ??= {}

  const key = `${name}@local-custom`
  const now = new Date().toISOString()
  const existing = registry.plugins[key]?.[0]
  registry.plugins[key] = [
    {
      scope: 'user',
      installPath: target,
      version,
      source: 'custom',
      installedAt: existing?.installedAt ?? now,
      lastUpdated: now,
      enabled: existing?.enabled ?? true,
    },
  ]
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n')
  console.log(`  ✓ 注册表已更新:${key}(v${version})`)

  // 第五步：检测 custom 下的同名插件重复安装（跳过备份目录）
  for (const dir of readdirSync(customDir)) {
    if (dir === name || dir === `.${name}.bak`) continue
    const otherManifest = join(customDir, dir, 'plugin.json')
    try {
      const other = JSON.parse(readFileSync(otherManifest, 'utf-8'))
      if (other.name === name) {
        console.warn(`  ⚠ custom/${dir} 也是 '${name}' 插件，建议在 Qoder 插件面板中移除其一`)
      }
    } catch {
      // 非插件目录，忽略
    }
  }
}

export function install(pluginRoot: string): void {
  const manifest = JSON.parse(readFileSync(join(pluginRoot, 'plugin.json'), 'utf-8'))
  const name: string = manifest.name
  const version: string = manifest.version
  if (!name || !version) {
    console.error('根 plugin.json 缺少 name 或 version')
    process.exit(1)
  }

  const homes = targetHomes()
  if (!homes.length) {
    console.error('未找到 ~/.qoder 或 ~/.qoder-cn 目录，请先安装并启动 Qoder')
    process.exit(1)
  }
  for (const qoderHome of homes) {
    console.log(`[${qoderHome}]`)
    installToHome(qoderHome, pluginRoot, name, version)
  }

  console.log(`完成。重启 Qoder 后在 设置 → 插件 面板查看 '${name}'。`)
}

export default { install }

if (process.argv[1]?.endsWith('install.ts')) {
  install(resolve(process.argv[2] ?? '.'))
}
