# DYC

十一种 AI Agent 工程化工作流技能——规划、审查、调试、UI、写作、研究等。源自 [tw93/Waza](https://github.com/tw93/Waza)，适配多厂商运行时。

[English](README.md)

## 特性

- **多厂商适配**：`plugin.json` 为唯一事实源，通过 `extensions` + `init.ts` 适配 Claude Code、Codex、Qoder
- **11 个技能**覆盖完整工程工作流：规划 → 构建 → 审查 → 调试 → 文档
- **写作规则**：中英文写作规范、反模式、持久上下文
- **9 个 MCP 服务器**：浏览器自动化、文档检索、组件库、仓库知识

## 安装

先注册父级市场（[m2-plugins](https://github.com/mymx2/m2-plugins)），再安装插件：

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

## 前置条件

- Node.js ≥ 18
- MCP 服务器通过 `mcp.json` 自动配置（playwright、chrome-devtools、deepwiki、context7、github、mdn、shadcn-vue、ai-elements-vue、tdesign-mcp-server）

## 包含技能

| 技能       | 说明                                                            |
| ---------- | --------------------------------------------------------------- |
| `think`    | 将粗略想法转化为可执行的、决策完备的方案，再动手写代码          |
| `ui`       | 生成高质量、可投产的页面、组件和排印 UI                         |
| `check`    | 审查代码 diff、PR、发布就绪检查、项目体检、文档校对             |
| `hunt`     | 先定位根因再修复——错误、崩溃、回归问题                          |
| `write`    | 中英文改稿润色，去除 AI 味，编写技术文档                        |
| `read`     | 读取 URL 和 PDF——抓取、摘要或转为干净的 Markdown                |
| `learn`    | 六阶段研究流程，将陌生材料整理为可发布的长文                    |
| `health`   | 审计 Agent 指令、配置漂移、Hooks/MCP 和 AI 可维护性             |
| `forge`    | 插件与技能全生命周期：创建、多厂商适配、发现、安装、编写、校验  |
| `chrome`   | 通过 chrome-devtools-mcp 驱动真实 Chrome 浏览器进行自动化和分析 |
| `repowiki` | 生成 DeepWiki 风格的仓库分析报告，含 Mermaid 图表               |

## 规则

| 文件                       | 用途                         |
| -------------------------- | ---------------------------- |
| `rules/anti-patterns.md`   | 代码和工作流中常见的反模式   |
| `rules/chinese.md`         | 中文写作规范和风格指南       |
| `rules/english.md`         | 英文写作规范和风格指南       |
| `rules/durable-context.md` | 长会话场景下的持久上下文模式 |

## MCP 配置

| 服务器               | 说明                                                                                              | 所需环境变量                   |
| -------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------ |
| `playwright`         | 通过 [Playwright MCP](https://github.com/microsoft/playwright-mcp) 进行浏览器自动化               | 无                             |
| `chrome-devtools`    | 通过 [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) 控制真实 Chrome | 无                             |
| `deepwiki`           | 通过 [DeepWiki](https://mcp.deepwiki.com/) 检索仓库知识                                           | 无                             |
| `context7`           | 通过 [Context7](https://github.com/upstash/context7) 实时检索库文档                               | `CONTEXT7_API_KEY`             |
| `github`             | 通过 [GitHub MCP Server](https://github.com/github/github-mcp-server) 访问 GitHub 仓库            | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| `mdn`                | 通过 [Mozilla MCP](https://github.com/mdn/mcp) 检索 MDN 文档                                      | 无                             |
| `shadcn-vue`         | [shadcn-vue](https://www.shadcn-vue.com/docs/mcp) 组件库 MCP                                      | 无                             |
| `ai-elements-vue`    | [AI Elements Vue](https://www.ai-elements-vue.com/overview/mcp-server) 注册表 MCP                 | 无                             |
| `tdesign-mcp-server` | [TDesign](https://tdesign.tencent.com/miniprogram/mcp) 组件库 MCP                                 | 无                             |

### 环境变量

两个 MCP 服务器需要 API Key，请在启动 Agent 前设置：

```bash
# Bash / Zsh（Linux / macOS）
export CONTEXT7_API_KEY="your-context7-api-key"
export GITHUB_PERSONAL_ACCESS_TOKEN="your-github-pat"
```

```powershell
# PowerShell（Windows）
$env:CONTEXT7_API_KEY = "your-context7-api-key"
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "your-github-pat"
```

```cmd
:: CMD（Windows）
set CONTEXT7_API_KEY=your-context7-api-key
set GITHUB_PERSONAL_ACCESS_TOKEN=your-github-pat
```

要永久生效，添加到 shell 配置文件（`~/.bashrc`、`~/.zshrc`）或 Windows 系统环境变量。

| 变量                           | 获取地址                                                           |
| ------------------------------ | ------------------------------------------------------------------ |
| `CONTEXT7_API_KEY`             | 免费获取：[context7.com/dashboard](https://context7.com/dashboard) |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens    |

## 许可证

[MIT](LICENSE)
