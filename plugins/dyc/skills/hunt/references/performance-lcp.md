# LCP and Page-Load Performance Debugging

Load when the symptom is slow page load, poor Core Web Vitals, or "the main content takes too long to appear", and a live browser is available through chrome-devtools-mcp tools or its CLI.

Largest Contentful Paint (LCP) is the time from navigation start until the largest image or text block renders in the viewport. Good: ≤2.5s; needs improvement: 2.5–4.0s; poor: >4.0s (at the 75th percentile of visits). On 73% of mobile pages the LCP element is an image.

## The Four Subparts

Every LCP breaks into four sequential subparts with no gap or overlap. Optimization means finding the bottleneck subpart first:

| Subpart                   | Ideal share | What it measures                               |
| ------------------------- | ----------- | ---------------------------------------------- |
| Time to First Byte (TTFB) | ~40%        | Navigation start → first byte of HTML          |
| Resource load delay       | <10%        | TTFB → browser starts loading the LCP resource |
| Resource load duration    | ~40%        | Download time of the LCP resource              |
| Element render delay      | <10%        | Resource downloaded → element rendered         |

Both delay subparts should be near zero. Signal reading: a large TTFB→FCP delta means render-blocking assets or heavy client-side work; a large FCP→LCP delta means the LCP resource was not prioritized; large resource load delay means the resource was not discoverable early; large render delay means stylesheets, scripts, or long tasks block rendering.

Common pitfall: optimizing one subpart without measuring the others. If render delay is the bottleneck, compressing the image just shifts the saved time into render delay.

## What counts as the LCP element

`<img>` (first frame for animated content), `<image>` inside SVG, `<video>` (poster load or first frame, whichever is earlier), elements with `url()` background images, and block-level text containers. Chromium excludes opacity-0 elements, full-viewport covers, and low-entropy placeholders. Size is measured by visible area (intrinsic size for images when smaller); margin, padding, and borders do not count.

## Debugging Workflow

Run the steps in order; each builds on the previous one.

1. **Record a trace.** `navigate_page` to the target URL, then `performance_start_trace` with `reload: true` and `autoStop: true`. Note the insight set IDs in the output.
2. **Analyze LCP insights.** Call `performance_analyze_insight` with the set ID and each of: `LCPBreakdown` (the four subparts with timings), `DocumentLatency` (server/TTFB issues), `RenderBlocking` (resources blocking render), `LCPDiscovery` (early discoverability).
3. **Identify the LCP element.** Run the "Identify LCP Element" snippet below via `evaluate_script`. The `url` field names the resource to find in the network waterfall; an empty `url` means the LCP element is text-based.
4. **Check the network waterfall.** `list_network_requests` filtered by `resourceTypes: ["Image", "Font"]` (adjust per step 3), then `get_network_request` for the LCP resource. A start time far later than the first resource means load delay to eliminate; a long duration means the file is too big or the server too slow.
5. **Audit the HTML.** Run the "Audit Common Issues" snippet via `evaluate_script` for lazy-loaded viewport images, missing `fetchpriority`, and render-blocking scripts.

## Optimization Strategies

Apply the fix for the bottleneck subpart, in this priority order.

**Eliminate resource load delay (target <10%)** — the most common bottleneck. Use a standard `<img src>`; never `loading="lazy"` on the LCP image; no JS/CSS-injected or `data-src` LCP resources. Add `<link rel="preload" fetchpriority="high">` when the image is not discoverable in the initial HTML, and `fetchpriority="high"` on the LCP `<img>` itself. Host critical resources same-origin or add `<link rel="preconnect">`.

**Eliminate element render delay (target <10%)** — inline critical CSS and defer the rest (keep the stylesheet smaller than the LCP resource); no synchronous scripts in `<head>`; break up long main-thread tasks; use SSR so the element exists in the initial HTML.

**Reduce resource load duration (target ~40%)** — modern formats (AVIF, WebP), responsive `srcset`, compression, CDN proximity, efficient `Cache-Control`, `fetchpriority="high"` so lower-priority resources do not compete. Use `font-display: swap` when text LCP is blocked by a web font.

**Reduce TTFB (target ~40%)** — minimize redirects, cache HTML at the edge, move dynamic logic to the edge, keep pages eligible for bfcache.

## Verification and Emulation

Re-run the trace with `reload: true` and compare the subpart breakdown; the bottleneck subpart should shrink. Lab measurements differ from the field: `emulate` with `networkConditions: "Fast 3G"` and `cpuThrottlingRate: 4` surfaces issues visible only on slower connections and devices.

## Snippets

**Identify LCP Element** (via `evaluate_script`):

```javascript
;async () => {
  return await new Promise(resolve => {
    new PerformanceObserver(list => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      resolve({
        element: last.element?.tagName,
        id: last.element?.id,
        className: last.element?.className,
        url: last.url,
        startTime: last.startTime,
        renderTime: last.renderTime,
        loadTime: last.loadTime,
        size: last.size,
      })
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
}
```

**Audit Common Issues** (lazy viewport images, missing fetchpriority, render-blocking scripts):

```javascript
;() => {
  const issues = []

  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    const rect = img.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
      issues.push({
        issue: 'lazy-loaded image in viewport',
        element: img.outerHTML.substring(0, 200),
        fix: 'Remove loading="lazy" — this image is in the initial viewport and may be the LCP element',
      })
    }
  })

  document.querySelectorAll('img:not([fetchpriority])').forEach(img => {
    const rect = img.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.width * rect.height > 50000) {
      issues.push({
        issue: 'large viewport image without fetchpriority',
        element: img.outerHTML.substring(0, 200),
        fix: 'Add fetchpriority="high" — this image is large and visible in the initial viewport',
      })
    }
  })

  document
    .querySelectorAll('head script:not([async]):not([defer]):not([type="module"])')
    .forEach(script => {
      if (script.src) {
        issues.push({
          issue: 'render-blocking script in head',
          element: script.outerHTML.substring(0, 200),
          fix: 'Add async or defer, or move to end of body',
        })
      }
    })

  return { issueCount: issues.length, issues }
}
```

_Workflow and snippets adapted from [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) skills (Apache 2.0)._
