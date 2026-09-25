# Design Reference

Two rule tiers apply. Normative rules (accessibility, tech-stack conflicts, absolute bans) hold regardless of direction. Everything else is craft detail in service of the locked direction: break it deliberately when the direction calls for it, and name the tradeoff. A detail whose removal changes nothing was decoration.

## Tech Stack Conflicts

Never combine: Tailwind + CSS Modules on same element; Framer Motion + CSS transitions on same element; styled-components/emotion + Tailwind; multiple icon libraries; multiple Google Font display families; glassmorphism backdrop-filter + solid border; dark background + `#ffffff` text at full opacity; Tailwind v4 `@theme` + dynamically constructed class names (class gets purged; use static names, `safelist`, or `:root` + `extend.colors`).

Before writing the first component, name the single CSS strategy: Tailwind only, CSS Modules only, or CSS-in-JS only.

## Common Traps

Before submitting, check whether any of the following slipped in without intention:

- A purple or blue gradient over white as the hero background
- A three-part hero: large headline, one-line subtext, two CTA buttons side by side
- Numbered markers (`01 / 02 / 03`), eyebrows, and dividers decorating content that carries no sequence or structure for them to encode
- A grid of cards with identical rounded corners, identical drop shadows, identical padding
- A top navigation bar with logo left, links center, primary action far right
- A centered icon or illustration sitting above a heading above a paragraph

Any of these can appear if they serve the design intentionally. They cannot appear by default. If you swapped in completely different content and the layout still made sense without changes, you built a template, not a design.

## Content Authenticity

**Sample data:** no generic names (John Doe) or companies (Acme Corp); use culturally varied names with specificity (Priya Mehta, Meridian Logistics). No Lorem Ipsum. No round numbers (`99.99%` uptime looks synthetic; use `99.94%`, `47.2%`). Multiple avatars must not share the same image; multiple cards must not share the same date.

**UI copy:** sentence case on all headings (Title Case is the most common AI tell). No exclamation marks in success states. No passive voice in errors ("Something went wrong" -> "We couldn't load your data. Try refreshing."). Banned AI marketing words: Elevate, Seamless, Unleash, Delve, Game-changer, Next-Gen, "In the world of...".

## UI Copy

- Controls name the exact outcome: "Save changes", not "Submit". An action keeps the same name through the whole flow.
- An empty screen names the first step without apologizing.
- Name things by what people control, not how the system is built.

## Placeholders Over Imitations

When an icon, image, or component is unavailable: use a placeholder. Never draw illustrative imagery using inline SVG. SVG is for icons and geometric shapes; for photography or product shots, use a placeholder and ask the user to supply real assets.

## Production Quality Baseline

### Accessibility

The WCAG 2.1 AA checklist is single-sourced in the `accessibility-checklist` reference; apply it before handoff.

### Animation

Settle whether it animates before settling how, and let frequency decide. Hundreds of times a day (keyboard shortcut, command palette) gets no animation; tens (hover, disclosure) gets the shortest form; occasional (modal, toast) gets standard treatment; rare (onboarding, completion) can carry delight. Never animate a keyboard-initiated state change.

Duration follows the element: press feedback 100-150ms, tooltip 125-200ms, dropdown 150-250ms, modal 200-500ms. Over 300ms needs a stated reason. Perceived speed is set by the first frame; fix the curve before the number.

- Honor `prefers-reduced-motion`: replace slides/springs with short cross-fades or ~80ms state snaps, drop overshoot.
- Animate `transform`/`opacity` only (no layout thrash)
- Default to exponential ease-out (`cubic-bezier(0.16,1,0.3,1)`). Exception: motion a finger is still driving (drag-to-dismiss) may use a small bounce. System-initiated motion stays strictly ease-out.
- Never enter from `scale(0)`: enter from `scale(0.95)` paired with `opacity: 0`.
- Anchor popovers, dropdowns, and tooltips to the control that opened them, not their own center. Modals stay centered.
- Prefer CSS transitions for interactive state changes (retarget mid-animation); reserve keyframe animations for staged sequences that run once.
- Subtle exit: small fixed `translateY(-12px)`, ~150ms `ease-in`, shorter than enter. That short exit is the only place `ease-in` belongs.
- Buttons use `scale(0.96)` on press via CSS transitions. Hover alone is not press feedback.

### Motion Budgets and Scene Red Lines

Budgets that hold regardless of the committed direction:

- Hover under 100ms, tap/press under 150ms. Slower reads as broken.
- Exit is 65-75% of entrance duration. Stagger total under 500ms.
- Distance scales duration: 50px ~0.8x base, full-screen up to 1.8-2x.
- Overshoot: success 5-10%, error 0%, celebration 15-25%, premium/corporate 0%.

Scene red lines (violations read as bugs):

- Dashboards: no `animation: infinite`, no entrance longer than 2s.
- Never linear easing on spatial movement; only rotation, progress, opacity loops.
- Never opacity alone for important state changes; pair position or scale.
- 1/3 rule: no unbroken motion > 1/3 of container; at most 1/3 of elements animate simultaneously.
- Fewer than 20 animated elements per viewport, 60fps sustained. Cut ambient layers first.

### Performance

- `will-change` only for `transform`, `opacity`, or `filter`; never `will-change: all`. Add only on first-frame stutter.
- Images: explicit `width` and `height`; below-fold `loading="lazy"`.
- Critical fonts: `font-display: swap`.

### Touch and Mobile

- `touch-action: manipulation` (prevents double-tap zoom delay)
- Full-bleed layouts: `env(safe-area-inset-*)` for notch devices
- Modals and drawers: `overscroll-behavior: contain`
- Wrap interactive hover states with `@media(hover:hover)` so they only apply on pointer devices.

### Typography Details

- Font smoothing: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale` once on the root layout (macOS only)
- Tabular numbers: single-sourced in the `design-data-viz` reference; apply its alignment rules
- Letter-spacing scales with font size: display type needs negative tracking. Roughly -0.022em for 32px and above, -0.012em for 20-28px, normal at 16px and below. Positive letter-spacing on large headlines is always wrong.

### Surfaces

- Concentric border radius: `outerRadius = innerRadius + padding`; if padding exceeds `24px`, treat layers as separate surfaces.
- Optical alignment: nudge icons by eye. Buttons with text and an icon use slightly less padding on the icon side (`pl-4 pr-3.5`).
- Shadows over borders: layered `box-shadow` for depth; reserve `border` for dividers and table cells.
- Image outlines: `outline: 1px solid rgba(0,0,0,0.1); outline-offset: -1px` (light) or `outline: 1px solid rgba(255,255,255,0.1); outline-offset: -1px` (dark).
- Minimum hit area: 44x44px (48x48px on touch-primary surfaces); extend with a centered pseudo-element when the visible element is smaller; never let hit areas overlap.
- Multi-card alignment: cards in one row share one height; bottom-align all CTA buttons. Section bottom padding often needs to be 20-25% larger than top for optical balance.
- Layer with the alpha surface, occlude with the opaque one. Nested layers (card in panel, input fill, active tab pill) take translucent surfaces; opaque surfaces are for modals, drawers, portaled popovers, sticky headers.
- Light-mode surface hierarchy: adjacent nested surfaces need a background-color step of at least 4% lightness, or a shadow of at least `0 1px 3px rgba(0,0,0,0.10)`.
- Dark-mode surface hierarchy: near-black canvas with semi-transparent white overlays for elevation (cards `rgba(255,255,255,0.02)`, elevated `0.04`, prominent `0.05`). Borders: `rgba(255,255,255,0.05)` subtle, `0.08` standard. Luminance stepping is the primary depth cue.
- Border radius system: define a named radius scale during direction lock (minimal: `{4px, 8px, 12px, pill}`). Commit before the first component.

### Adding to Existing UI

When extending an existing interface, match its visual vocabulary before writing new code: copywriting tone, color palette and semantic roles, hover/click states, animation style, shadow and card treatment, layout density, border radius choices. If swapping in different content would make the new component look out of place, the vocabulary was not matched closely enough. A redesign request inverts the rule: keep product truth, content, and function, but treat the old look as anti-reference and replace it fully. Never split the difference.

### Responsive & Screen Verification

- Verify the rendered surface, not a type check. Screenshot at phone (375px) and desktop (1280px), in every shipped locale.
- Line widows: inspect short last lines; tighten repetition only when meaning survives.
- Mobile CTA: natural width, left-aligned, height unchanged. Centering reads as floating; full-width reads heavy.
- Spacing is a system: scale the whole set by a single factor across breakpoints rather than tuning one gap.
- Long-form surfaces stay light: borderless prev/next pager, thin-rail sidebar active state, build-time zero-runtime-JS code highlighting.

## Data Visualization Surfaces

For dashboards, analytics views, or number-dense displays, load the `design-data-viz` reference.

## Reflex Fonts to Reject

LLMs default to these because they dominate training data. The ban is on reflex use as a display face; informed product-UI use (e.g. Inter for a dense data table) is allowed when justified. Any font used reflexively without a stated reason qualifies.

Reject: Inter, DM Sans, DM Serif Display, DM Serif Text, Outfit, Plus Jakarta Sans, Instrument Sans, Instrument Serif, Space Grotesk, Space Mono, IBM Plex Sans, IBM Plex Serif, IBM Plex Mono, Syne, Fraunces, Newsreader, Lora, Crimson Pro, Crimson Text, Playfair Display, Cormorant, Cormorant Garamond.

## Font Selection Procedure

1. Write three words that describe the brand (e.g. "precise, minimal, fast").
2. Name the three fonts you would reach for reflexively.
3. Reject all three.
4. Pick a typeface from a named foundry (Klim, Commercial Type, Colophon, Grilli Type, OH no Type, Village) or an open-source option with a clear personality. Be able to explain why in one sentence.

## CJK & Multilingual Type

When the interface mixes CJK with Latin, Latin-only type rules silently break CJK text:

- **Latin face first, system CJK face after**: `font-family: -apple-system, "SF Pro Text", "PingFang SC", "Noto Sans SC", sans-serif;`.
- **CJK body text needs more line-height than Latin**: roughly 1.7-1.8 vs 1.4-1.5.
- **Tag runs with `lang="zh"` / `lang="ja"` / `lang="en"`**.
- **Serif reading modes need an explicit CJK serif fallback**: `"Newsreader", "Songti SC", "Noto Serif SC", serif`.
- **Do not apply negative letter-spacing to CJK runs.** Scope tracking to `lang="en"`.

## Color System: OKLCH Rules

- Use OKLCH instead of HSL. OKLCH is perceptually uniform: equal numeric changes produce equal perceived changes.
- Reduce chroma as lightness approaches extremes. At 85% lightness, chroma ~0.08; pushing to 0.15 looks garish.
- Tint neutrals toward the brand hue with chroma 0.005-0.01.
- 60-30-10 is visual weight, not pixel count: 60% neutral/surface, 30% secondary, 10% accent.
- Never gray text on colored background; use a shade of the background hue at reduced lightness.
- One semantic severity ramp per ordered dimension (neutral, low, medium, high, critical); each stop carries distinct lightness.
- Colorize one dimension by meaning; do not rainbow every column.

## Theme Matrix

Choose light or dark deliberately based on audience and context. Neither is a default. If the answer is not obvious from the context, default to light.

## Absolute Bans (CSS-Pattern Level)

These patterns appear in the majority of AI-generated interfaces. Not exhaustive -- any CSS pattern applied as a mindless default belongs here.

| Pattern                                                          | Rewrite                                                                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `border-left`/`border-right` wider than 1px as a section accent  | Colored dot, short horizontal rule, background swatch, or typographic weight shift                                         |
| `background-clip: text` gradient text                            | Solid brand color, tinted neutral, or typographic weight                                                                   |
| `backdrop-filter: blur` glassmorphism as default card surface    | Elevated surfaces via background color steps and `box-shadow`                                                              |
| Purple-to-blue gradients or cyan-on-dark accent systems          | Palette from brand words via OKLCH rules above                                                                             |
| Generic rounded-rect card with `box-shadow` as default container | Default to cardless sections; add card treatment only when content requires it                                             |
| Modals as a lazy escape for overflow UI                          | Inline expand, detail panel, or dedicated route; modals only for true focus-lock actions                                   |
| `transition: all` or animating width/height/padding/margin       | List exact properties (`transition-property: transform, opacity`); use `grid-template-rows: 0fr to 1fr` for height reveals |

## Reference-site Brand Presets (awesome-design-md)

`VoltAgent/awesome-design-md` maintains 66+ curated DESIGN.md files. Running `npx getdesign@latest add <brand>` drops the file into the project root. Never auto-run; offer it during direction lock, run only with explicit approval, and treat the result as seed material. This skill's rules always win on conflict; state overrides in the handoff summary. When source code and a screenshot are both available, read the code. When only a URL is provided, ask for a screenshot.

## Reference Material Priority

When source code and a screenshot are both available for a reference UI: read the code. Source files contain exact token values; screenshots require guessing. When only a URL is provided, fetching returns stripped text with no layout information. For visual references, ask for a screenshot.

## Design Direction Scaffold (prose)

For a multi-page or production UI, emit a short `DESIGN.md`-style summary before writing the first component: visual theme, color palette and roles, typography rules, component stylings (with states), layout principles, depth/elevation, project-specific do's and don'ts, responsive behavior, and agent prompt guide. For a single component or quick prototype, skip this.

## Pre-Handoff Checklist: Strategic Omissions

Run through these before handoff and report material omissions. Add one only when the task or project's public requirements include that surface.

- [ ] **Custom 404 page**: if the task includes routing, a branded page needs a clear path back.
- [ ] **Back navigation**: every page reachable by user action must have a clear, functional path back. Dead-end pages are UX failures.
- [ ] **Form client-side validation**: email format validated before submit; inline errors adjacent to the field.
- [ ] **Skip-to-content link**: visually hidden `<a href="#main-content">Skip to main content</a>` as first focusable element.
- [ ] **Cookie consent**: if the product's tracking and jurisdiction require it, flag the missing flow.
- [ ] **Footer Privacy and Terms links**: if legal and distribution requirements call for them, verify they are discoverable.

## AI Slop Test

Would a stranger glancing at the first viewport say "an AI made this" immediately? If yes, the committed direction was not committed enough. The usual culprits: reflex font, default purple accent, centered hero with generic card grid beneath. Fix the typography, the color system, or the layout until the answer flips.

Whole-page looks cluster into defaults too: (1) warm cream background with a high-contrast serif display and a terracotta accent; (2) near-black background with a single acid-green or vermilion accent; (3) broadsheet layout with hairline rules, zero border-radius, and dense newspaper columns. All three are legitimate when the brief asks for one; each is a failure when the brief left the axis free and the freedom got spent on a default.

## App Shell Rules

When building a sidebar + main workspace layout: decorative backgrounds default to off; surface hierarchy uses background-color steps and shadow only; button radius is consistent within each component type (pick one: pill, square, or one fixed value).

## Options Guide

When asked for design options, give at least 3 variations across genuinely different dimensions (density, typographic personality, color temperature, layout structure, motion character). One option follows conventions, one remixes brand DNA, one is deliberately unexpected. Three options differing only by accent color are not three variations.

---

_Adapted from [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache 2.0), [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) frontend-design (Apache 2.0), [getdesign.md](https://getdesign.md) (MIT), [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT), [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), and [antfu/design](https://github.com/antfu/design) (MIT)._
