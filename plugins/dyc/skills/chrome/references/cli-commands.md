# Chrome DevTools CLI Command Surface

The `chrome-devtools` CLI drives the same browser from a terminal. Use it for shell scripts and batch automation; the MCP tools cover the same ground interactively.

## Installation

One-time prerequisite, not part of the regular workflow:

```sh
npm i chrome-devtools-mcp@latest -g
chrome-devtools status # check the install worked
```

- Old version keeps running: `chrome-devtools stop && npm uninstall -g chrome-devtools-mcp`, then reinstall.

## AI Workflow

1. Execute tools directly (e.g. `chrome-devtools list_pages`). The background server starts implicitly; do not run `start`/`status`/`stop` before each use.
2. `take_snapshot` to get element `<uid>`s.
3. Act with `click`, `fill`, etc. State persists across commands.

Snapshot output shape:

```
uid=1_0 RootWebArea "Example Domain" url="https://example.com/"
  uid=1_1 heading "Example Domain" level="1"
```

Command form: `chrome-devtools <tool> <pageId> [arguments] [flags]`. `pageId` is a **required positional argument** on every page-scoped tool — get IDs from `list_pages`. Required arguments are positional; optional arguments use flags. The CLI rejects flag-style required arguments:

```
INCORRECT: chrome-devtools click --pageId 1 --uid "1_2"
CORRECT:   chrome-devtools click 1 "1_2"
```

`--help` on any command shows usage. Output defaults to plain Markdown-like text; `--output-format=json` for JSON.

## Permissions & File Access

The two runtimes have opposite defaults:

- **CLI mode** (`chrome-devtools <cmd>`, which spawns the server internally): full filesystem access by default. The CLI auto-enables unrestricted paths unless you pass an explicit `--workspace`/`--filesystemRoot`.
- **MCP server mode** (`npx chrome-devtools-mcp@latest` wired into a client): file-writing tools are restricted to the OS temp directory (`os.tmpdir()`) unless the client negotiates MCP roots or the server is started with a path flag.

To widen access in MCP server mode, add to the server args:

```bash
--workspace=/path/to/dir        # allow a directory, repeatable
```

## Input Automation (uid from snapshot)

```bash
chrome-devtools take_snapshot 1                              # text snapshot, yields element uids
chrome-devtools click 1 "1_2"                                # click
chrome-devtools click 1 "1_2" --dblClick true                # double click
chrome-devtools drag 1 "1_2" "1_5"                           # drag element onto element
chrome-devtools fill 1 "1_3" "text"                          # fill input/textarea, or select option
chrome-devtools handle_dialog 1 accept                       # accept/dismiss a browser dialog
chrome-devtools handle_dialog 1 dismiss --promptText "hi"
chrome-devtools hover 1 "1_2"
chrome-devtools press_key 1 "Control+A"                      # key or combination
chrome-devtools type_text 1 "hello" --submitKey "Enter"
chrome-devtools upload_file 1 "1_4" "file.txt"
```

Add `--includeSnapshot true` to any input action to get the updated snapshot back.

## Navigation

```bash
chrome-devtools list_pages
chrome-devtools new_page "https://example.com"
chrome-devtools new_page "https://example.com" --background true --isolatedContext "ctx"
chrome-devtools navigate_page 1 --type "url" --url "https://example.com" --timeout 5000
chrome-devtools navigate_page 1 --type "reload" --ignoreCache true
chrome-devtools navigate_page 1 --type "back" --initScript "foo()"
chrome-devtools navigate_page 1 --handleBeforeUnload "accept"
chrome-devtools select_page 1 --bringToFront true
chrome-devtools close_page 1
```

## Emulation

```bash
chrome-devtools emulate 1 --networkConditions "Offline"
chrome-devtools emulate 1 --cpuThrottlingRate 4 --geolocation "48.85,2.35"
chrome-devtools emulate 1 --colorScheme "dark" --viewport "1920x1080"
chrome-devtools emulate 1 --userAgent "Mozilla/5.0..."
chrome-devtools emulate 1 --extraHttpHeaders '{"X-Custom":"value"}'
chrome-devtools resize_page 1 1920 1080
```

## Performance

```bash
chrome-devtools performance_start_trace 1 --reload true --autoStop false
chrome-devtools performance_start_trace 1 --reload true --autoStop true --filePath "t.json.gz"
chrome-devtools performance_stop_trace 1 --filePath "t.json.gz"
chrome-devtools performance_analyze_insight 1 "1" "LCPBreakdown"
```

## Memory

```bash
chrome-devtools take_heapsnapshot 1 "./snap.heapsnapshot"
```

Heap analysis commands (`get_heapsnapshot_summary`, `get_heapsnapshot_details`, `get_heapsnapshot_class_nodes`, `get_heapsnapshot_dominators`, `get_heapsnapshot_duplicate_strings`, `get_heapsnapshot_edges`, `get_heapsnapshot_object_details`, `get_heapsnapshot_retainers`, `get_heapsnapshot_retaining_paths`, `close_heapsnapshot`) are documented in `--help`. Memory debugging requires `--memoryDebugging=true`.

## Network

```bash
chrome-devtools list_network_requests 1 --pageSize 50 --pageIdx 0
chrome-devtools list_network_requests 1 --resourceTypes Fetch
chrome-devtools list_network_requests 1 --includePreservedRequests true
chrome-devtools get_network_request 1 --reqid 1
chrome-devtools get_network_request 1 --reqid 1 --requestFilePath "req.md" --responseFilePath "res.md"
```

## Debugging & Inspection

```bash
chrome-devtools evaluate_script "() => document.title" --pageId 1
chrome-devtools evaluate_script "(a) => a.innerText" --pageId 1 --args "1_4"
chrome-devtools list_console_messages 1 --pageSize 20 --types error --types info
chrome-devtools list_console_messages 1 --includePreservedMessages true
chrome-devtools get_console_message 1 1
chrome-devtools get_css_styles 1 "1_2"
chrome-devtools take_screenshot 1
chrome-devtools take_screenshot 1 --fullPage true --format "jpeg" --quality 80
chrome-devtools take_screenshot 1 --uid "1_2" --filePath "s.png"
chrome-devtools take_snapshot 1 --verbose true --filePath "s.txt"
chrome-devtools lighthouse_audit 1 --mode "navigation"
chrome-devtools lighthouse_audit 1 --mode "snapshot" --device "mobile" --outputDirPath ./out
```

Note: `evaluate_script` takes the function as its positional argument; the page is targeted with `--pageId` (omit it when evaluating in a service worker via `--serviceWorkerId`).

## Extensions

```bash
chrome-devtools list_extensions
chrome-devtools install_extension "/path/to/extension"
chrome-devtools uninstall_extension "extension_id"
chrome-devtools reload_extension "extension_id"
chrome-devtools trigger_extension_action "extension_id"
```

## Progressive Web Apps (requires `--categoryPwa=true`)

```bash
chrome-devtools install_pwa "https://example.com/" "https://example.com/"
chrome-devtools launch_pwa "https://example.com/"
chrome-devtools get_os_app_state "https://example.com/"
chrome-devtools uninstall_pwa "https://example.com/"
```

## Experimental Features (disabled by default)

- `click_at` — `--experimentalVision=true`
- `screencast_start`/`screencast_stop` — `--experimentalScreencast=true` (needs ffmpeg)
- `list_webmcp_tools`/`execute_webmcp_tool` — `--categoryExperimentalWebmcp=true`
- `list_3p_developer_tools`/`execute_3p_developer_tool` — `--categoryExperimentalThirdParty=true`

## Service Management

```bash
chrome-devtools start                                  # start or restart the server
chrome-devtools start --workspace=/                    # MCP-mode-style restriction lifted explicitly
chrome-devtools start --headless=false                 # visible browser window
chrome-devtools status
chrome-devtools stop
```

_Command surface verified against chrome-devtools-mcp 1.10.1 `--help` output ([ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp), Apache 2.0)._
