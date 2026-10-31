# Rendering Bug Debug Reference

Static analysis first (CSS review), then reproduce if needed.

### WeasyPrint

- `rgba()` causes double-rectangle bug: use solid hex colors instead
- `page-break-inside: avoid` is honored only when the block fits a page; an oversized block still breaks
- Float-based layouts often break at page boundaries: prefer flexbox or block
- External font URLs must be reachable server-side: check the URL, TLS certificate, and redirects; CORS does not gate server-side fetches

### Font Loading

- Check `@font-face` src paths (relative vs. absolute)
- CORS headers are irrelevant to server-side fetches; a blocked font here is a URL, certificate, or redirect problem
- Format support: WeasyPrint accepts WOFF/TTF; verify the installed renderer handles the chosen format instead of assuming a version cutoff
- Missing font fallback = invisible text or system fallback glyph

### Page Overflow

- Calculate content height vs. page height before debugging line-by-line
- Reduce `line-height`, `padding`, or `margin` to reclaim space
- Orphan/widow control: `orphans: 3; widows: 3` in `@page` body rule

### Browser Print CSS

- Confirm `@media print` rules are present and not overridden
- `@page` margin must account for printer unprintable area (~6mm minimum)
- `break-before: page` / `break-after: page` on section dividers
- Test with `window.print()` in browser DevTools, not just visual preview
