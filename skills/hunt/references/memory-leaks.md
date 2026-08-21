# Memory Leak Debugging with Heap Snapshots

Load when the symptom is high memory usage, OOM errors, or a leak suspicion in a JavaScript or Node.js application, and chrome-devtools-mcp memory tools are available. Heap inspection requires the MCP server started with `--memoryDebugging`; if the heap tools are absent from the tool list, ask the user to add the flag and restart (server setup mechanics live in the chrome skill).

## Core Principles

- Never read raw `.heapsnapshot` files directly; they are huge and burn context. Use the MCP heap tools to summarize, compare, and inspect.
- Isolate first: browser (client-side) or Node.js (server-side) leak.
- Usual culprits: detached DOM nodes, closures capturing large objects, unintentional globals, unremoved event listeners, unbounded caches.
- Detached DOM nodes are sometimes intentional caches. Signal them to the user and ask before nulling anything.
- Heap snapshots held by the MCP server are large. `close_heapsnapshot` every loaded snapshot when the investigation ends.

## Workflow

### 1. Capture snapshots

Drive the page into the suspect state with `click`, `navigate_page`, `fill`, etc. Repeat the same interaction about 10 times to amplify the leak, then revert to the original state to see whether memory is released. `take_heapsnapshot` at three points: baseline, target (after the actions), final (after reverting).

### 2. Compare snapshots

- `get_heapsnapshot_summary` on each file first: confirms they load and gives high-level totals.
- `compare_heapsnapshots` baseline vs target, starting without `classIndex` for the summary diff; request detailed class diffs (`classIndex`) only for classes with suspicious growth.
- Drill into node IDs only after the summary points somewhere.

### 3. Inspect retainers and dominator chains

- `get_heapsnapshot_class_nodes` lists instances of the suspicious class.
- `get_heapsnapshot_retainers`, `get_heapsnapshot_retaining_paths`, `get_heapsnapshot_dominators`, and `get_heapsnapshot_edges` explain why representative nodes are still reachable.
- `get_heapsnapshot_object_details` with a `nodeId` gives size, type, distance, and DOM detachedness.
- `get_heapsnapshot_duplicate_strings` when string growth dominates the diff.

### 4. Categorized filters

`get_heapsnapshot_details` and `get_heapsnapshot_class_nodes` accept a `filterName` targeting common leak causes directly:

- `objectsRetainedByDetachedDomNodes` — detached DOM elements retained in memory
- `objectsRetainedByEventHandlers` — objects kept alive by unremoved listeners
- `objectsRetainedByContexts` — objects trapped in closures or execution contexts
- `objectsRetainedByConsole` — objects retained by console logging

## Common Leak Patterns

Match these when the retaining path points at application code:

1. **Uncleared event listeners** — listeners on `window`, `document`, or long-lived objects keep callback closures (and everything they capture) alive. Fix: `removeEventListener` on unmount or when no longer needed.
2. **Detached DOM nodes** — a node removed from the document but still referenced by a variable. Not always a bug (some sites cache detached trees intentionally): ask the user before nulling. Fix when confirmed: null DOM references on removal, or narrow their scope.
3. **Unintentional globals** — undeclared variables in non-strict mode or explicit `window` attachments never get collected. Fix: strict mode, proper declarations, less global state.
4. **Closures** — inner functions capturing large outer-scope objects. Fix: null the large object when done, or restructure so the closure captures less.
5. **Unbounded caches** — objects, Arrays, or Maps that grow without limit. Fix: size caps, LRU eviction, or `WeakMap`/`WeakSet` for data tied to object lifecycles.

_Workflow and leak patterns adapted from [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) skills (Apache 2.0)._
