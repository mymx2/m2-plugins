---
name: chrome
description: 'Drives a real Chrome browser through the chrome-devtools-mcp MCP server or its CLI for page automation, network and console analysis, emulation, and extension testing. Use when a task needs operating a live browser: navigating, snapshotting the accessibility tree, interacting by element uid, capturing screenshots, traces, or heap snapshots, or fixing the MCP server setup itself. Not for diagnosing application logic root causes (use hunt) or judging visual quality (use ui).'
when_to_use: 'chrome devtools, 浏览器自动化, 操作浏览器, 网页截图, browser automation, take snapshot, click element by uid, headless chrome, chrome mcp, devtools protocol, 浏览器点击, 表单填写自动化, mcp server 连不上'
---

# Chrome: Drive a Real Browser Through DevTools

Prefix your first line with 🥷 inline, not as its own paragraph.

If the browser did not actually do it, it did not happen. Report from tool output, never from assumption.

## Outcome Contract

- Outcome: the browser performed the requested navigation, interaction, capture, or diagnosis, proven by tool output.
- Done when: the final page state, artifact (screenshot, snapshot, trace, heapsnapshot), or error is shown from a real tool call.
- Evidence: snapshot uids, tool responses, saved artifact paths, console or network output.
- Output: the interaction result or the captured artifact, with any unreachable step named explicitly.

## Process

1. Pick the surface: MCP tools when the runtime exposes them; the `chrome-devtools` CLI for shell scripts and batch automation (load `references/cli-commands.md`).
2. Drive in order: navigate → wait for known content → `take_snapshot` → interact by element `uid`. Parallel calls are allowed only when they respect this order.
3. Retrieve efficiently: `filePath` parameters for large outputs, pagination and type filters for lists, `includeSnapshot: false` on input actions unless updated page state is needed.
4. If a tool call or the server itself fails, load `references/troubleshooting.md` and follow the diagnostic sequence instead of retrying blindly.

## Core Concepts

**Browser lifecycle**: the browser starts automatically on the first tool call with a persistent Chrome profile, configured via CLI args in the MCP server configuration (`npx chrome-devtools-mcp@latest --help`). Extra tool categories need flags: `--categoryExtensions` for extension tooling, `--memoryDebugging` for heap inspection tools.

**Page selection**: tools operate on the currently selected page. Use `list_pages`, then `select_page` to switch context.

**Element interaction**: `take_snapshot` returns the page's accessibility tree with a unique `uid` per element. If an element is not found, take a fresh snapshot — the element may have been removed or the page changed.

**Tool selection**: `take_snapshot` for automation (text-based, faster); `take_screenshot` when someone needs to see the visual state; `evaluate_script` for data the accessibility tree does not expose.

## Extension Testing

Extension tools (`install_extension`, `list_extensions`, `trigger_extension_action`, and friends) require the MCP server started with `--categoryExtensions`. If they are absent from the tool list, stop and ask the user to add the flag and restart the server.

1. Install: `install_extension` with the path to the unpacked extension.
2. Identify: get the extension ID from the response or `list_extensions`.
3. Trigger action: `trigger_extension_action` opens the popup or side panel.
4. Verify the service worker: `evaluate_script` with `serviceWorkerId` to check extension state.
5. Verify page behavior: navigate to a page the extension operates on and `take_snapshot` to confirm content scripts injected or modified the page correctly.

Chrome before 149 cannot load extensions when connecting to an existing instance (`--autoConnect`, `--browserUrl`); the server must launch Chrome itself.

## Gotchas

| What happened                                                                                | Rule                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Element `uid` not found mid-flow                                                             | The page changed under you. Take a fresh snapshot before retrying; never reuse uids across navigations                                           |
| Only ~9 tools available (navigation, screenshot, little else)                                | The MCP client is enforcing read-only mode or `--slim` is set; the full suite requires write-capable tools. See `references/troubleshooting.md`  |
| `upload_file` or file-saving parameters rejected outside the temp directory                  | The server only has OS temp directory access by default; unrestricted paths need an explicit server flag                                         |
| Snapshot taken but user asked "what does it look like"                                       | Snapshot is structure, not appearance. Take a screenshot for visual questions                                                                    |
| Debugging a slow page, memory growth, or a11y failures turned into app-logic root-cause work | Tool operation stays here; root-cause diagnosis belongs to the hunt skill's performance and memory references, visual assessment to the ui skill |

_Tool mechanics adapted from [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) skills (Apache 2.0)._
