# Native App Freeze Mode

Loaded from `hunt` when a desktop or mobile native app reports beachball, not responding, tab-switch freeze, first-open lag, idle wake stall, overlay lockup, or a screenshot shows a frozen app.

Evidence to collect before changing code:

1. Exact user path and version: first launch versus warm launch, the tab or window transition, idle duration, permissions, display count, and any setting that makes the freeze disappear.
2. Runtime capture while frozen: `sample <process>`, recent app logs, CPU and memory footprint, thread count, and whether the main thread is blocked, spinning, or allocating.
3. First-frame surface: view body work, first `.task`, synchronous icon or metadata lookup, filesystem scans, URL parent walks, notification callbacks, and app/window wake handlers.
4. Blast search after the fix: grep the same API shape across the repo, especially path parent walks, synchronous icon loading, metadata reads in render paths, and callbacks that run on the main thread.

Common native freeze traps:

- Launch, terminate, permission, audio, display, or workspace notifications doing path walks, icon lookup, filesystem scans, or process enumeration on the main thread.
- First paint hydrating a full app list, directory tree, media thumbnail set, or system status table before showing an interactive shell.
- An input-lock or full-screen overlay without a guaranteed teardown path for Escape, app deactivation, permission denial, process termination, and window close.
- Timer or sampler work that survives hidden windows, long idle periods, sleep/wake, or app reactivation.

Compile-only and source-only checks are insufficient for this mode. The outcome must include the runtime capture, the root-cause frame or state transition, the focused regression guard, and any sibling matches that were fixed or explicitly left safe.
