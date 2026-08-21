# Performance Review Checklist

Load and work this checklist when reviewing code that could affect load time, interaction responsiveness, data fetching, or query paths. Measure before optimizing; never block a change on assumed, unmeasured slowness.

## Core Web Vitals Targets

| Metric | Good     | Needs work | Poor    |
| ------ | -------- | ---------- | ------- |
| LCP    | <= 2.5s  | <= 4.0s    | > 4.0s  |
| INP    | <= 200ms | <= 500ms   | > 500ms |
| CLS    | <= 0.1   | <= 0.25    | > 0.25  |

## TTFB Diagnosis (when TTFB > 800ms)

Check each component in the DevTools Network waterfall:

- **DNS resolution** slow -> add `<link rel="dns-prefetch">` / `<link rel="preconnect">` for known origins
- **TCP/TLS handshake** slow -> enable HTTP/2, consider edge deployment, verify keep-alive
- **Server processing** slow -> profile backend, check slow queries, add caching

## Frontend

### Images

- [ ] Modern formats (WebP, AVIF); responsive `srcset` + `sizes`
- [ ] Explicit `width`/`height` on images and `<source>` (prevents CLS in art direction)
- [ ] Below-fold images `loading="lazy"` + `decoding="async"`; hero/LCP images `fetchpriority="high"` and no lazy loading

### JavaScript

- [ ] Bundle under 200KB gzipped (initial load); code split with dynamic `import()`
- [ ] Tree shaking enabled; no blocking JS in `<head>` (defer/async)
- [ ] Heavy computation offloaded to Web Workers; long tasks (> 50ms) chunked to keep the main thread free (main INP lever)
- [ ] `yieldToMain` / `scheduler.yield()` inside long loops; `isInputPending()` to yield only when needed
- [ ] `requestIdleCallback` for deferrable work (analytics flush, prefetch); non-critical work out of event handlers
- [ ] Third-party scripts `async`/`defer`, audited for size, fronted by a facade when heavy

### CSS & Fonts

- [ ] Critical CSS inlined/preloaded; no render-blocking CSS; no CSS-in-JS runtime cost in production
- [ ] Fonts: 2-3 families/weights, WOFF2, self-host when possible, LCP-critical fonts preloaded, `font-display: swap`, `unicode-range` subsetting, `size-adjust`/metric overrides to reduce CLS

### Network & Rendering

- [ ] Static assets cached with long `max-age` + content hashing; API responses cached where appropriate
- [ ] HTTP/2 or HTTP/3; preconnect to known origins; `fetchpriority` on critical non-image resources
- [ ] No layout thrashing; animations on `transform`/`opacity`
- [ ] Long lists virtualized; off-screen sections `content-visibility: auto` + `contain-intrinsic-size`
- [ ] No `unload` handlers and no `Cache-Control: no-store` on HTML (preserves bfcache)

## Backend

- [ ] No N+1 queries (eager loading / joins); queries indexed; list endpoints paginated
- [ ] Connection pooling configured; slow query logging enabled
- [ ] Response times < 200ms (p95); no synchronous heavy computation in request handlers
- [ ] Bulk operations instead of loops; response compression (gzip/brotli); appropriate caching

## Measurement

Measure with the same command and conditions as the baseline; change one thing at a time; beat run-to-run variance, not just the mean. Use field data first (CrUX / RUM) for INP, then DevTools Performance recording on mid-range hardware with CPU throttling. Tools: Lighthouse CLI, `webpack-bundle-analyzer` / `vite-bundle-visualizer`, `bundlesize`, `web-vitals` (incl. the attribution build for interaction-level INP detail).

## Keep-or-Revert Decision

A fix is a hypothesis until re-measured. Decide strictly against the baseline:

| Result vs. baseline                 | Action                                                         |
| ----------------------------------- | -------------------------------------------------------------- |
| Past the threshold, tests green     | **Keep** — commit with the before/after numbers in the message |
| Within noise (no measurable change) | **Revert**                                                     |
| Worse                               | **Revert**                                                     |
| Improved, but a test went red       | **Revert** — a regression wearing a win's clothing             |

**"Neutral" is a revert, not a keep.** Code you keep, you maintain forever — an optimization that bought nothing is pure maintenance cost. **Correctness gates the metric**: an "optimization" that wins by dropping work the product needed (skipping a validation, caching what must be fresh, removing a load-bearing `await`) is a regression, not a win.

**Log every attempt, including the reverted ones.** Reverted work leaves no trace in git history, which is why the same dead idea gets retried next quarter. Keep a short ledger (idea / baseline → result / verdict / why) in the PR description or a `PERF.md`, so the next person or agent reads it before re-proposing a failed experiment.

## Common Anti-Patterns

| Anti-Pattern         | Impact                      | Fix                                  |
| -------------------- | --------------------------- | ------------------------------------ |
| N+1 queries          | Linear DB load growth       | Joins, includes, batch loading       |
| Unbounded queries    | Memory exhaustion, timeouts | Always paginate, add LIMIT           |
| Missing indexes      | Slow reads as data grows    | Index filtered/sorted columns        |
| Layout thrashing     | Jank, dropped frames        | Batch DOM reads, then writes         |
| Unoptimized images   | Slow LCP, wasted bandwidth  | WebP, responsive sizes, lazy load    |
| Large bundles        | Slow time-to-interactive    | Code split, tree shake, audit deps   |
| Blocking main thread | Poor INP                    | Chunk long tasks, offload to workers |
| Memory leaks         | Growing memory, crashes     | Clean up listeners, intervals, refs  |
