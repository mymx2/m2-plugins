# Accessibility Debugging on a Live Page

Load when auditing or debugging accessibility on a rendered page with chrome-devtools-mcp tools available: semantic structure, labels, focus flow, tap targets, contrast. Pairs with `accessibility-checklist.md` (the WCAG rule list); this file is the tool-driven audit workflow.

## Core Concepts

**Accessibility tree vs DOM**: visually hiding an element (`opacity: 0`) behaves differently for screen readers than `display: none` or `aria-hidden="true"`. `take_snapshot` returns the accessibility tree — what assistive technologies actually "see" — making it the most reliable source of truth for semantic structure.

**Reading web.dev guidelines**: append `.md.txt` to a web.dev article URL (e.g. `https://web.dev/articles/accessible-tap-targets.md.txt`) to fetch the clean raw Markdown instead of the rendered page.

## Audit Workflow

### 1. Automated baseline (Lighthouse)

Run `lighthouse_audit` with `mode: "navigation"` (captures load issues) and an `outputDirPath` for the JSON report. Check `scores` (a score under 1 means violations) and the failed-audit count. Do not read the report line by line; filter failures with a one-liner:

```bash
node -e "const r=require('./report.json'); Object.values(r.audits).filter(a=>a.score!==null && a.score<1).forEach(a=>console.log(JSON.stringify({id:a.id, title:a.title, items:a.details?.items})))"
```

This extracts the `selector` and `snippet` of failing elements without loading the full report into context.

### 2. Browser-native issues

Chrome reports common a11y problems itself. Call `list_console_messages` with `types: ["issue"]` and `includePreservedMessages: true` to catch load-time issues — often missing labels and invalid ARIA without any manual digging.

### 3. Semantics and structure

`take_snapshot` exposes heading hierarchy and landmarks. Verify heading levels are logical and do not skip. Compare the snapshot's DOM order against a `take_screenshot` visual read: floats or absolute positioning can make visual order diverge from the accessibility tree's reading order.

### 4. Labels, forms, text alternatives

In the snapshot, interactive elements need accessible names (an icon-only button must not read as `""`), images need `alt`, and every form input needs an associated label. Run the "Find Orphaned Form Inputs" snippet below.

### 5. Focus and keyboard navigation

Move focus with `press_key` (`Tab`, `Shift+Tab`), then `take_snapshot` and locate the focused element to confirm focus landed on the expected control. A modal must receive focus on open and trap it until closed.

### 6. Tap targets

Targets should be at least 48×48px with adequate spacing. The accessibility tree does not carry sizes — run the "Measure Tap Target Size" snippet, passing the element `uid` from the snapshot as the `evaluate_script` argument.

### 7. Color contrast

Start with `list_console_messages` `types: ["issue"]` and look for "Low Contrast" entries. When native audits are silent (some headless environments) or a specific element needs checking, run the "Check Color Contrast" snippet. It uses a simplified algorithm and does not handle transparency, gradients, or background images; for production-grade auditing inject `axe-core`, and for text over complex backgrounds fall back to `take_screenshot` for a legibility read.

### 8. Global page checks

Run the "Global Page Checks" snippet for document-level settings component testing misses: `lang`, `title`, viewport `user-scalable=no`, reduced-motion.

## Snippets

**Find Orphaned Form Inputs** — inputs with no `label[for]`, `aria-label`, `aria-labelledby`, or wrapping `<label>`:

```js
;() =>
  Array.from(document.querySelectorAll('input, select, textarea'))
    .filter(i => {
      const hasId = i.id && document.querySelector(`label[for="${i.id}"]`)
      const hasAria = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby')
      return !hasId && !hasAria && !i.closest('label')
    })
    .map(i => ({
      tag: i.tagName,
      id: i.id,
      name: i.name,
      placeholder: i.placeholder,
    }))
```

**Measure Tap Target Size** — pass the element's `uid` from the snapshot:

```js
el => {
  const rect = el.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}
```

**Check Color Contrast** — approximate ratio against WCAG AA (4.5:1 normal text, 3:1 large text); pass the element's `uid`:

```js
el => {
  function getRGB(colorStr) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255]
  }
  function luminance(r, g, b) {
    const a = [r, g, b].map(function (v) {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
  }

  const style = window.getComputedStyle(el)
  const fg = getRGB(style.color)
  let bg = getRGB(style.backgroundColor)

  const l1 = luminance(fg[0], fg[1], fg[2])
  const l2 = luminance(bg[0], bg[1], bg[2])
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

  return {
    color: style.color,
    bg: style.backgroundColor,
    contrastRatio: ratio.toFixed(2),
  }
}
```

**Global Page Checks**:

```js
;() => ({
  lang: document.documentElement.lang || 'MISSING - Screen readers need this for pronunciation',
  title: document.title || 'MISSING - Required for context',
  viewport:
    document.querySelector('meta[name="viewport"]')?.content ||
    'MISSING - Check for user-scalable=no (bad practice)',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'Enabled'
    : 'Disabled',
})
```

_Workflow and snippets adapted from [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) skills (Apache 2.0)._
