# Frontend Engineering: Production-Quality UI

Load when building or modifying interfaces, pages, or components where the output must look production-quality and accessible, not AI-generated. Complements the main ui skill (which drives the committed visual direction and screenshot iteration).

## Component Architecture

- **Prefer composition over configuration** (`<Card><CardTitle>…` over one over-configured `<Card title=… headerVariant=… content=…>`).
- **Keep components focused** - one thing each; colocate tests/stories/types/styling with the component.
- **Separate data fetching (container) from presentation** - a loading/error/empty state for the data path, a pure render component for display.

## State Management

Choose the simplest approach that works: local `useState` → lifted state → context (theme/auth/locale) → URL state (filters/pagination) → server state cache → global store. Avoid prop drilling deeper than 3 levels.

## Avoid the AI Aesthetic

| AI default                   | Production quality                               |
| ---------------------------- | ------------------------------------------------ |
| Purple/indigo everything     | The project's actual palette                     |
| Excessive gradients          | Flat/subtle gradients matching the design system |
| Rounded-2xl everything       | Consistent border-radius from the design system  |
| Generic hero sections        | Content-first layouts                            |
| Lorem-ipsum copy             | Realistic placeholder content                    |
| Oversized padding everywhere | Consistent spacing scale                         |
| Uniform stock card grids     | Purpose-driven layouts                           |
| Shadow-heavy design          | Subtle or no shadows                             |

Use a consistent spacing scale (don't invent 13px); respect the type hierarchy (one h1 per page, no skipped levels, no heading styles for non-heading content); use semantic color tokens not raw hex; ensure contrast (4.5:1 text, 3:1 large); never rely on color alone to convey state.

## Accessibility (WCAG 2.1 AA)

- **Keyboard navigation** - every interactive element focusable and operable (use `<button>`, not `<div onClick>`); Enter/Space handlers when a non-native element has a role.
- **Labels** - `aria-label` for icon-only buttons; `<label htmlFor>` for inputs.
- **Focus management** - move focus when content changes; trap focus in open dialogs.
- **Meaningful empty/error states** - no blank screens; `role="status"` for dynamic messages.
- **Dynamic content** - ARIA live regions announce changes.

## Responsive & States

Mobile-first, then expand; test at 320/768/1024/1440. Include skeleton loading (not spinners for content), empty states, error states, and optimistic updates for perceived speed.

## Red Flags

- Components >200 lines; inline styles or arbitrary pixel values
- Missing error/loading/empty states; no keyboard-nav testing
- Color as the sole state indicator; generic "AI look"
- Selector specificity collisions: two class selectors with overlapping specificity (e.g. `.section` and `.cta`) silently cancel each other, most often on padding/margin between sections; keep one selector strategy per concern
