# Chrome DevTools MCP Troubleshooting

Load when `list_pages`, `new_page`, or `navigate_page` fails, or the server will not start. Follow the steps in order; do not retry the failing call blindly.

## 1. Find and read the configuration

Locate the MCP configuration in the user's workspace: `.mcp.json`, `gemini-extension.json`, `.claude/settings.json`, `.vscode/launch.json`, or `.gemini/settings.json`. Read it for incorrect arguments or flags, missing environment variables, and `--autoConnect` used in incompatible environments. Ask the user for the configuration only when none of these files exist.

## 2. Triage common errors by symptom

**`Could not find DevToolsActivePort`** — specific to `--autoConnect`: the server cannot find the file a running, debuggable Chrome creates. Follow this exact sequence:

1. Ask the user to confirm the correct Chrome variant (e.g. Chrome Canary, if the error mentions it) is running.
2. If running, have them enable remote debugging: open a new tab, go to `chrome://inspect/#remote-debugging`, check "Enable remote debugging".
3. Once confirmed, your only next call is `list_pages` — the simplest verification. Do not retry the original, more complex command yet.
4. If `list_pages` succeeds, done. Only if it still fails, move to `--browserUrl` or sandboxing checks.

**Server starts but creates a new empty profile / `list_pages` is empty** — check for flag typos first (`--autoBronnect` instead of `--autoConnect`), then verify the arguments match the expected flags exactly.

**Only ~9 tools available** (`list_pages`, `get_console_message`, `lighthouse_audit`, `take_heapsnapshot`, little else) — the MCP client is enforcing read-only mode. Every tool is annotated `readOnlyHint`; write tools (`emulate`, `click`, `navigate_page`) get filtered out. The user must disable read-only mode in their client (e.g. exit Plan Mode) or loosen tool safety settings. Also check `--slim`, which enables only navigation and screenshot tools by design.

**Extension tools missing or extensions fail to load** — confirm `--categoryExtensions` is in the server configuration, and that the server launches Chrome itself: Chrome before 149 cannot load extensions when connecting to an existing instance (`--autoConnect`, `--browserUrl`).

**Other common errors** — `Target closed`; "Tool not found" (check `--slim`); `ProtocolError: Network.enable timed out`; `The socket connection was closed unexpectedly`; `Error [ERR_MODULE_NOT_FOUND]`; sandboxing or host validation errors.

## 3. Read known issues

Map the error against the upstream troubleshooting doc: https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/troubleshooting.md — especially sandboxing restrictions (macOS Seatbelt, Linux containers), WSL requirements, and `--autoConnect` handshakes and timeouts (requires a running Chrome 144+).

## 4. Formulate a configuration

Based on the exact error and the user's environment (OS, MCP client):

- Pass `--browser-url=http://127.0.0.1:9222` instead of `--autoConnect` in sandboxed environments.
- Enable remote debugging in Chrome (`chrome://inspect/#remote-debugging`) and accept the connection prompt; ask the user to verify it when using `--autoConnect`.
- Add `--logFile <absolute_path>` to capture debug logs.
- Increase `startup_timeout_ms` (e.g. to 20000) for slow environments.

If unsure of the user's configuration, ask them to paste their current MCP server JSON.

## 5. Run diagnostics

```bash
npx chrome-devtools-mcp@latest --help                                        # verify install and Node.js
DEBUG=* npx chrome-devtools-mcp@latest --logFile=/tmp/cdm-test.log          # verbose logs
```

## 6. Search existing issues

If the known-issues doc does not cover the error and `gh` is available:

```bash
gh issue list --repo ChromeDevTools/chrome-devtools-mcp --search "<error snippet>" --state all
```

Otherwise point the user at the repository's issues and discussions pages.

_Diagnostic sequence adapted from [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) skills (Apache 2.0)._
