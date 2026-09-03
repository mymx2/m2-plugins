<div align="center">

[![author](https://img.shields.io/badge/author-🤖_mymx2-E07A28?logo=github)](https://github.com/mymx2)
[![License: MIT](https://img.shields.io/badge/License-MIT-A31F34)](https://mit-license.org)
[![skills.sh](https://skills.sh/b/mymx2/m2-plugins)](https://skills.sh/mymx2/m2-plugins)

[中文](./README_CN.md)

</div>

# M2 Plugins

A plugin marketplace for AI agents, supporting **Claude Code**, **Codex**, **Qoder**, and **CodeBuddy**.

## Plugins

| Plugin                  | Description                               |
| ----------------------- | ----------------------------------------- |
| [**dyc**](plugins/dyc/) | Engineering workflow skills for AI agents |

Each plugin has its own README with skill details and usage.

## Installation

Pick your agent:

<details>
<summary><b>Claude Code</b></summary>

```bash
# 1. Register marketplace
/plugin marketplace add mymx2/m2-plugins

# 2. Install plugin
/plugin install dyc@m2-plugins
```

Docs: [Plugin docs](https://code.claude.com/docs/en/discover-plugins)

```bash
# List installed plugins
/plugin list

# Update plugin to the latest version
/plugin update dyc@m2-plugins

# Disable / enable / uninstall
/plugin disable dyc@m2-plugins
/plugin enable dyc@m2-plugins
/plugin uninstall dyc@m2-plugins
```

**Local development**

```bash
# 1. Clone and enter the repo
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. Validate the plugin
claude plugin validate ./plugins/dyc

# 3. Load without installing
claude --plugin-dir ./plugins/dyc
```

</details>

<details>
<summary><b>Codex</b></summary>

```bash
# 1. Register marketplace
codex plugin marketplace add mymx2/m2-plugins

# 2. Install plugin
codex plugin add dyc@m2-plugins
```

Docs: [Plugin docs](https://developers.openai.com/plugins/build/plugins)

```bash
# Browse marketplaces, install or uninstall entries;
# press Space on an installed plugin to turn it on or off
/plugins
```

No separate update command: reopen `/plugins`, refresh the marketplace listing, and reinstall the entry (or restart Codex) to pick up the latest version.

**Local development**

```bash
# 1. Clone and enter the repo
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. Regenerate the Codex manifest and MCP config
vp run init

# 3. Add the repo as a local marketplace, then install from it
codex
/plugins
```

</details>

<details>
<summary><b>Qoder</b></summary>

```bash
# 1. Register marketplace
qodercli plugins marketplace add mymx2/m2-plugins

# 2. Install plugin
qodercli plugins install dyc
```

Docs: [Plugin docs](https://docs.qoder.com/zh/cli/plugins)

```bash
# List installed plugins
qodercli plugins list

# Update plugin to the latest version from its marketplace
qodercli plugins update dyc@m2-plugins

# Disable / enable / uninstall
qodercli plugins disable dyc
qodercli plugins enable dyc
qodercli plugins uninstall dyc
```

**Local development**

```bash
# 1. Clone and enter the repo
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. Validate the plugin
qodercli plugins validate ./plugins/dyc

# 3. Install plugin locally (copies into ~/.qoder and ~/.qoder-cn)
vp run qoder:dyc

# 4. Reload in the TUI
/plugins reload
```

</details>

<details>
<summary><b>CodeBuddy</b></summary>

```bash
# 1. Register marketplace
/plugin marketplace add mymx2/m2-plugins

# 2. Install plugin
/plugin install dyc@m2-plugins
```

Docs: [Plugin docs](https://www.codebuddy.cn/docs/cli/plugin-marketplaces)

```bash
# Open the plugin manager (Discover / Installed / Marketplaces / Errors)
/plugin

# Update plugin to the latest version
/plugin update dyc@m2-plugins

# Disable / enable / uninstall
/plugin disable dyc@m2-plugins
/plugin enable dyc@m2-plugins
/plugin uninstall dyc@m2-plugins
```

**Local development**

```bash
# 1. Clone and enter the repo
git clone https://github.com/mymx2/m2-plugins.git
cd m2-plugins

# 2. Regenerate all vendor manifests (root init.ts calls each vendor's init, including CodeBuddy)
vp run init

# 3. Validate the plugin
codebuddy plugin validate ./plugins/dyc

# 4. Load without installing
codebuddy --plugin-dir ./plugins/dyc
```

</details>

## 🏝️ Thanks

This project is heavily inspired by the following awesome projects:

- [tw93/Waza](https://github.com/tw93/Waza) — core skills source (think, check, hunt, ui, read, write, learn, health)
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — validator & lint reference
- [mattpocock/skills](https://github.com/mattpocock/skills) — distillation reference

## License

[MIT](./LICENSE) © 2025-PRESENT CDY
