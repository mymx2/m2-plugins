# Chrome DevTools CLI Command Surface

The `chrome-devtools` CLI drives the same browser from a terminal. Use it for shell scripts and batch automation; the MCP tools cover the same ground interactively.

## Installation

One-time prerequisite, not part of the regular workflow:

```sh
npm i chrome-devtools-mcp@latest -g
chrome-devtools status # check the install worked
```

- Command not found: put the global npm `bin` directory on `PATH`, then restart the terminal.
- `EACCES` on install: do not use `sudo`; use a node version manager or a different npm global directory.
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

Command form: `chrome-devtools <tool> [arguments] [flags]`. Required arguments are positional; optional arguments use flags. `--help` on any command shows usage. Output defaults to plain Markdown-like text; `--output-format=json` for JSON.

## Permissions & File Access

By default the server can only touch the OS temp directory (`os.tmpdir()`). File-saving parameters (`--filePath`, `--outputDirPath`) and `upload_file` outside it need unrestricted access:

```bash
chrome-devtools start --allowUnrestrictedPaths=true
```

## Input Automation (uid from snapshot)

```bash
chrome-devtools take_snapshot                        # text snapshot, yields element uids
chrome-devtools click "uid"                          # click
chrome-devtools click "uid" --dblClick true          # double click
chrome-devtools drag "src" "dst"                     # drag element onto element
chrome-devtools fill "uid" "text"                    # fill input/textarea, or select option
chrome-devtools handle_dialog accept                 # accept/dismiss a browser dialog
chrome-devtools handle_dialog dismiss --promptText "hi"
chrome-devtools hover "uid"
chrome-devtools press_key "Control+A"                # key or combination
chrome-devtools type_text "hello" --submitKey "Enter"
chrome-devtools upload_file "uid" "file.txt"
```

Add `--includeSnapshot true` to any input action to get the updated snapshot back.

## Navigation

```bash
chrome-devtools list_pages
chrome-devtools new_page "https://example.com"
chrome-devtools new_page "https://example.com" --background true --isolatedContext "ctx"
chrome-devtools navigate_page --url "https://example.com" --timeout 5000
chrome-devtools navigate_page --type "reload" --ignoreCache true
chrome-devtools navigate_page --type "back" --initScript "foo()"
chrome-devtools navigate_page --handleBeforeUnload "accept"
chrome-devtools select_page 1 --bringToFront true
chrome-devtools close_page 1
```

## Emulation

```bash
chrome-devtools emulate --networkConditions "Offline"
chrome-devtools emulate --cpuThrottlingRate 4 --geolocation "0x0"
chrome-devtools emulate --colorScheme "dark" --viewport "1920x1080"
chrome-devtools emulate --userAgent "Mozilla/5.0..."
chrome-devtools resize_page 1920 1080
```

## Performance

```bash
chrome-devtools performance_start_trace true false            # reload=true, autoStop=false
chrome-devtools performance_start_trace true true --filePath "t.json.gz"
chrome-devtools performance_stop_trace --filePath "t.json.gz"
chrome-devtools performance_analyze_insight "1" "LCPBreakdown"
```

## Memory

```bash
chrome-devtools take_heapsnapshot "./snap.heapsnapshot"
```

Memory debugging below requires `--memoryDebugging=true`:

```bash
chrome-devtools get_heapsnapshot_summary "./snap.heapsnapshot"
chrome-devtools compare_heapsnapshots "./base.heapsnapshot" "./target.heapsnapshot"
chrome-devtools get_heapsnapshot_class_nodes "./snap.heapsnapshot" "Array"
chrome-devtools get_heapsnapshot_details "./snap.heapsnapshot" 123
chrome-devtools get_heapsnapshot_dominators "./snap.heapsnapshot" 123
chrome-devtools get_heapsnapshot_duplicate_strings "./snap.heapsnapshot"
chrome-devtools get_heapsnapshot_edges "./snap.heapsnapshot" 123
chrome-devtools get_heapsnapshot_object_details "./snap.heapsnapshot" 123
chrome-devtools get_heapsnapshot_retainers "./snap.heapsnapshot" 123
chrome-devtools get_heapsnapshot_retaining_paths "./snap.heapsnapshot" 123
chrome-devtools close_heapsnapshot "./snap.heapsnapshot"
```

## Network

```bash
chrome-devtools list_network_requests --pageSize 50 --pageIdx 0
chrome-devtools list_network_requests --resourceTypes Fetch
chrome-devtools list_network_requests --includePreservedRequests true
chrome-devtools get_network_request --reqid 1
chrome-devtools get_network_request --reqid 1 --requestFilePath "req.md" --responseFilePath "res.md"
```

## Debugging & Inspection

```bash
chrome-devtools evaluate_script "() => document.title"
chrome-devtools evaluate_script "(a) => a.innerText" --args 1_4
chrome-devtools list_console_messages --pageSize 20 --types error --types info
chrome-devtools list_console_messages --includePreservedMessages true
chrome-devtools get_console_message 1
chrome-devtools take_screenshot
chrome-devtools take_screenshot --fullPage true --format "jpeg" --quality 80
chrome-devtools take_screenshot --uid "uid" --filePath "s.png"
chrome-devtools take_snapshot --verbose true --filePath "s.txt"
chrome-devtools lighthouse_audit --mode "navigation"
chrome-devtools lighthouse_audit --mode "snapshot" --device "mobile" --outputDirPath ./out
```

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
chrome-devtools install_pwa "https://example.com/"
chrome-devtools launch_pwa "https://example.com/"
chrome-devtools get_os_app_state "https://example.com/"
chrome-devtools uninstall_pwa "https://example.com/"
```

## Experimental Features (disabled by default, enable via `start` flags)

```bash
chrome-devtools click_at 100 200                              # --experimentalVision=true
chrome-devtools screencast_start --filePath "screen.mp4"     # --experimentalScreencast=true, needs ffmpeg
chrome-devtools screencast_stop
chrome-devtools list_webmcp_tools                             # --categoryExperimentalWebmcp=true
chrome-devtools execute_webmcp_tool "tool_name" '{"arg":"val"}'
chrome-devtools list_3p_developer_tools                       # --categoryExperimentalThirdParty=true
chrome-devtools execute_3p_developer_tool "tool_name" '{"arg":"val"}'
```

## Service Management

```bash
chrome-devtools start                                  # start or restart the server
chrome-devtools start --allowUnrestrictedPaths=true   # full filesystem access
chrome-devtools start --headless=false                # visible browser window
chrome-devtools status
chrome-devtools stop
```

_Command surface condensed from [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) skills (Apache 2.0)._
