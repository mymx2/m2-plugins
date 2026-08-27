# Accessibility Checklist (WCAG 2.1 AA)

Quick reference for WCAG 2.1 AA compliance. Use alongside the `frontend-engineering` reference when building UI.

## Essential Checks

### Keyboard Navigation

- [ ] All interactive elements focusable via Tab key
- [ ] Focus order follows visual/logical order
- [ ] Focus is visible (outline/ring on focused elements)
- [ ] Custom widgets have keyboard support (Enter to activate, Escape to close)
- [ ] No keyboard traps (user can always Tab away)
- [ ] Skip-to-content link at top of page, visible at least on keyboard focus
- [ ] Modals trap focus while open, return focus on close

### Screen Readers

- [ ] All images have `alt` text (or `alt=""` for decorative images)
- [ ] All form inputs have associated labels (`<label>` or `aria-label`)
- [ ] Buttons and links have descriptive text (not "Click here")
- [ ] Icon-only buttons have `aria-label`
- [ ] Page has one `<h1>` and headings don't skip levels
- [ ] Dynamic content changes announced (`aria-live` regions)
- [ ] Tables have `<th>` headers with scope

### Visual

- [ ] Text contrast >= 4.5:1 (normal) or >= 3:1 (large text, 18px+)
- [ ] UI components contrast >= 3:1 against background
- [ ] Color is not the only way to convey information
- [ ] Text resizable to 200% without breaking layout
- [ ] No content flashes more than 3 times per second

### Forms

- [ ] Every input has a visible label
- [ ] Required fields indicated (not by color alone)
- [ ] Error messages specific and associated with the field
- [ ] Error state visible by more than color (icon, text, border)
- [ ] Form submission errors summarized and focusable
- [ ] Known fields use autocomplete (e.g. `type="email" autocomplete="email"`)

### Content

- [ ] Language declared (`<html lang="en">`)
- [ ] Page has a descriptive `<title>`
- [ ] Links distinguish from surrounding text (not by color alone)
- [ ] Touch targets >= 44x44px on mobile
- [ ] Meaningful empty states (not blank screens)

## Common HTML Patterns

- **Buttons vs. links:** use `<button>` for actions, `<a href>` for navigation; never `div`/`span` as buttons.
- **Form labels:** use `<label htmlFor>` or implicit wrapping; a visible label is preferred over `aria-label`.
- **ARIA roles:** `<nav aria-label>`, `role="status"`/`aria-live="polite"` for status, `role="alert"` for errors, `<dialog aria-modal>` for modals, `aria-busy` for loading.
- **Accessible lists:** `<ul role="list">` with labelled checkboxes.

## ARIA Live Regions

| Value                   | Behavior                | Use for                             |
| ----------------------- | ----------------------- | ----------------------------------- |
| `aria-live="polite"`    | Announced at next pause | Status updates, saved confirmations |
| `aria-live="assertive"` | Announced immediately   | Errors, time-sensitive alerts       |
| `role="status"`         | Same as polite          | Status messages                     |
| `role="alert"`          | Same as assertive       | Error messages                      |

## Testing Tools

Automated: `npx axe-core`, `npx pa11y`. In browser: Chrome DevTools Lighthouse Accessibility, Elements > Accessibility tree. Screen readers: VoiceOver (macOS), NVDA/JAWS (Windows), Orca (Linux).

## Common Anti-Patterns

| Anti-Pattern                 | Fix                                          |
| ---------------------------- | -------------------------------------------- |
| `div` as button              | Use `<button>`                               |
| Missing `alt` text           | Add descriptive `alt`                        |
| Color-only states            | Add icons, text, or patterns                 |
| Autoplaying media            | Add controls, don't autoplay                 |
| Custom dropdown with no ARIA | Use native `<select>` or proper ARIA listbox |
| Removing focus outlines      | Style outlines, don't remove them            |
| Empty links/buttons          | Add text or `aria-label`                     |
| `tabindex > 0`               | Use `tabindex="0"` or `-1` only              |
