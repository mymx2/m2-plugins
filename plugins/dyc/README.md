# DYC

Eleven engineering workflow skills for AI agents — planning, review, debugging, UI, writing, research, and more. Sourced from [tw93/Waza](https://github.com/tw93/Waza), adapted for multi-vendor runtimes.

[中文](README_CN.md)

## Features

- **Multi-vendor**: one `plugin.json` source of truth, adapted to Claude Code, Codex, and Qoder via `extensions` + `init.ts`
- **11 skills** covering the full engineering workflow: plan → build → review → debug → document
- **Writing rules** for Chinese and English prose, anti-patterns, and durable context
- **9 MCP servers** for browser automation, documentation, component libraries, and repository knowledge

## Installation

Register the parent marketplace ([m2-plugins](https://github.com/mymx2/m2-plugins)) first, then install:

```bash
# Claude Code
/plugin marketplace add mymx2/m2-plugins
/plugin install dyc@m2-plugins

# Codex
codex plugin marketplace add mymx2/m2-plugins
codex plugin add dyc@m2-plugins

# Qoder
vp run qoder:dyc
```

## Prerequisites

- Node.js ≥ 18
- MCP servers auto-configured via `mcp.json` (playwright, chrome-devtools, deepwiki, context7, github, mdn, shadcn-vue, ai-elements-vue, tdesign-mcp-server)

## Included Skills

| Skill      | Description                                                                           |
| ---------- | ------------------------------------------------------------------------------------- |
| `think`    | Turns rough ideas into approved, decision-complete plans before coding                |
| `ui`       | Produces distinctive, production-grade UI for pages, components, and typography       |
| `check`    | Reviews code diffs, PRs, release readiness, project audits, and doc proofreading      |
| `hunt`     | Finds root cause before applying fixes for errors, crashes, and regressions           |
| `write`    | Rewrites and polishes prose in Chinese or English, removes AI-like wording            |
| `read`     | Reads URLs and PDFs — fetches, summarizes, or converts to clean Markdown              |
| `learn`    | Six-phase research workflow turning unfamiliar material into publish-ready output     |
| `health`   | Audits agent instructions, config drift, hooks/MCP, and AI maintainability            |
| `forge`    | Plugin & skill lifecycle: create, adapt multi-vendor, find, install, author, validate |
| `chrome`   | Drives a real Chrome browser via chrome-devtools-mcp for automation and analysis      |
| `repowiki` | Generates a DeepWiki-style repository analysis report with Mermaid diagrams           |

## Rules

| File                       | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| `rules/anti-patterns.md`   | Common anti-patterns to avoid in code and workflow     |
| `rules/chinese.md`         | Chinese writing conventions and style guide            |
| `rules/english.md`         | English writing conventions and style guide            |
| `rules/durable-context.md` | Durable context patterns for long-lived agent sessions |

## MCP Configuration

| Server               | Description                                                                                                  | Required Env Vars              |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `playwright`         | Browser automation via [Playwright MCP](https://github.com/microsoft/playwright-mcp)                         | None                           |
| `chrome-devtools`    | Live Chrome browser control via [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | None                           |
| `deepwiki`           | Repository knowledge retrieval via [DeepWiki](https://mcp.deepwiki.com/)                                     | None                           |
| `context7`           | Real-time library documentation via [Context7](https://github.com/upstash/context7)                          | `CONTEXT7_API_KEY`             |
| `github`             | GitHub repository access via [GitHub MCP Server](https://github.com/github/github-mcp-server)                | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| `mdn`                | MDN Web Docs retrieval via [Mozilla MCP](https://github.com/mdn/mcp)                                         | None                           |
| `shadcn-vue`         | [shadcn-vue](https://www.shadcn-vue.com/docs/mcp) component library MCP                                      | None                           |
| `ai-elements-vue`    | [AI Elements Vue](https://www.ai-elements-vue.com/overview/mcp-server) registry MCP                          | None                           |
| `tdesign-mcp-server` | [TDesign](https://tdesign.tencent.com/miniprogram/mcp) component library MCP                                 | None                           |

### Environment Variables

Two MCP servers require API keys. Set them before starting your agent:

```bash
# Bash / Zsh (Linux / macOS)
export CONTEXT7_API_KEY="your-context7-api-key"
export GITHUB_PERSONAL_ACCESS_TOKEN="your-github-pat"
```

```powershell
# PowerShell (Windows)
$env:CONTEXT7_API_KEY = "your-context7-api-key"
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "your-github-pat"
```

```cmd
:: CMD (Windows)
set CONTEXT7_API_KEY=your-context7-api-key
set GITHUB_PERSONAL_ACCESS_TOKEN=your-github-pat
```

To persist across sessions, add them to your shell profile (`~/.bashrc`, `~/.zshrc`) or Windows system environment variables.

| Variable                       | Where to Get It                                                  |
| ------------------------------ | ---------------------------------------------------------------- |
| `CONTEXT7_API_KEY`             | Free at [context7.com/dashboard](https://context7.com/dashboard) |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens  |

## License

[MIT](LICENSE)
