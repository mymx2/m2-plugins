# Mode: Lock the Direction First

Loaded from `ui` when the ask is a new page, component, or visual system rather than a fix to an existing screen. Quick-fix and screenshot-iteration paths skip this file; the existing product is their direction.

**Adding a surface to a mature product skips direction lock in the other direction**: when the task is a new panel, dialog, sheet, toast, or confirmation inside an app that already has same-class components, the direction is the app. Grep for the existing sibling component first and reuse its container, motion, and typography tokens; inventing a new style needs a stated reason why no existing component fits. First drafts that ignore the app's own component vocabulary get rejected on sight.

Resolve the five direction dimensions below before writing code. Take colour, type, width, and voice from the current product's tokens, sibling components, screenshots, and the repo's git history first; then from other shipped products by the same team or author when they exist; then from the conversation. Model-default palettes, default fonts, and freehand graphics are allowed only when no reference exists. Infer first, state the strongest inferred answer for every unresolved dimension, and ask the user to correct only the material assumptions. An existing product may answer all five without another user turn.

1. **Who uses this, and in what context?** Analyst dashboard differs from landing page or onboarding flow. See "App shell exception" below if the answer is a sidebar + main workspace layout.
2. **What is the aesthetic direction?** Name it precisely: dense editorial, raw terminal, ink-on-paper, brutalist grid, warm analog. "Clean and modern" is not a direction. If the user names a reference site or product ("feels like Linear / Claude.ai / Vercel"), do not accept it as a direction -- extract 3 concrete properties from it: button radius philosophy, surface depth treatment (shadow vs background step vs border), and accent color family. Name those instead.

   **Shortcut for well-known brands**: when exact brand tokens would materially improve a direction that remains underdetermined, offer the "Reference-site Brand Presets" path in `design-reference.md`. Run the preset only with explicit approval, then decompose against the generated file. Skip it when screenshots, source tokens, or sibling components already settle the direction.

3. **What is the design signature?** A typeface, color system, unexpected motion, asymmetric layout. Pick one and make it obvious.
4. **What are the hard constraints?** Framework, bundle size, contrast minimums, keyboard accessibility.
5. **What is the signature micro-interaction?** Scale on press, staggered reveal, or contextual icon animation. Pick one and know exactly how it's implemented.

Do not write code until all five are resolved by evidence, a stated assumption, or clarification. A dimension can be "none": a quiet utility surface may deliberately have no signature motion.

Survey 2-3 mature products only when the problem is a genuinely unfamiliar interaction pattern or the direction remains underdetermined after reading the current product. Record one concrete decision from each. Skip this for cosmetic fixes, established sibling components, and tasks whose references already settle the pattern; mandatory benchmarking on every component produces imitation and delays obvious work.

### Source repo as reference

When the user provides a repository URL or pastes source code of an existing product to recreate or extend: the file tree is a menu, not the meal. Do not reconstruct the UI from memory or training data. Instead, read the actual source:

- Theme and token files: `theme.ts`, `colors.ts`, `tokens.css`, `_variables.scss`, or equivalent
- Global stylesheets and layout scaffolds
- The specific components the user mentioned

Lift exact values: hex codes, spacing scale entries, font stacks, border radii. A rough approximation is not pixel fidelity.

Only attach the target component folder or package. Exclude `.git`, `node_modules`, `dist`, and lock files. Dragging in an entire monorepo pollutes the context with irrelevant code and degrades output quality.

### Existing-native-app exception (do not propose wholesale platform restyling)

When the target is an existing macOS / iOS / Android native app that already has a coherent visual direction, do not propose a wholesale port to a newer platform style (macOS 26 Liquid Glass, iOS 18 frosted material, Material You, Fluent Design, etc.) as the default improvement plan. Wholesale restyling reads as "I do not have a specific design intent, here is the platform's." Default to incremental polish on the existing direction: spacing, alignment, hover and focus states, typography hierarchy, copy tightening, motion timing. Only propose a platform-style migration when the user has explicitly asked for it in this turn, or when the existing direction is broken in a way that incremental polish cannot fix. State the existing direction in one sentence before proposing changes so the user can correct the read.

When the change touches motion, press states, or animation timing on that native surface, load `design-native-motion.md`: the judgment carries over from the web rules, the idioms and the platform's default curves do not.

### App shell exception (sidebar + main workspace)

If question 1 is an app shell (Slack, Linear, Notion class), load the "App shell rules" section in `design-reference.md` and apply those constraints before proceeding.

### Data dashboard exception

If the surface is a dashboard, analytics view, or chart-heavy interface, also load `design-data-viz.md` for chart selection, number alignment, and product-benchmark rules. Skip when building marketing pages, landing pages, or generic components.

State the chosen direction in one sentence, then load `design-reference.md` and check the tech stack conflicts table. Name the single CSS strategy before writing the first component. Token decisions (color, font, motion), production craft, aesthetic review, DESIGN.md, options, and strategic omissions all live in that one canonical file.

Summarize the direction as three lines before writing any code:

- **Visual thesis**: mood, material, and energy in one sentence (e.g. "warm brutalist editorial with high-contrast ink type and rough paper texture")
- **Content plan**: hero -> support -> detail -> final CTA, one line each. For **app/dashboard surfaces**: skip the marketing structure, default to utility mode (orient, show status, enable action), no hero unless explicitly requested.
- **Interaction thesis**: either `none` with one evidence-based reason, or 2-3 specific motion ideas that change how the page feels (e.g. "hero text slides in on load, section headers pin while content scrolls beneath, CTA pulses on hover")

For production or multi-page UIs, expand the thesis into the 9-section DESIGN.md scaffold in `design-reference.md` (theme, palette, typography, components, layout, depth, do/don't, responsive, prompt guide). For a single component, the three lines are sufficient.
