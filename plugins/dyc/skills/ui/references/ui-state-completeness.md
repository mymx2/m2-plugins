# UI State Completeness: Interaction & Edge States

本文件是 loading/error/empty/skeleton 状态口径的正本；`frontend-engineering.md` 的状态段以本文件为准。

Load when a build or review touches forms, async actions, navigation, lists, tables, overlays, or any surface with data that can be empty, loading, or broken. This is the state-completeness layer: it checks whether the interface survives real usage, not whether it looks right on the happy path. Visual and token rules live in the design-reference reference; this file owns everything that breaks the moment data, latency, or permissions stop cooperating.

## Async Action Integrity (P1: verify before handoff)

- **Async buttons lock during submission**: show a loading indicator on the button itself, set `disabled`, and disable the form's inputs while the request is in flight. Violations look like: the button stays clickable and the request fires twice, or the user edits fields mid-submit and the state desyncs.
- **Form errors sit next to their field**, not only in a top toast or alert. A toast can summarize, but each failing field gets an inline message directly beneath it so the user knows what to fix. Validate on blur where the framework supports it; do not wait for submit to reveal the first error.
- **Destructive or irreversible actions get a confirmation step**: a dialog that names the consequence in plain words ("This permanently deletes 34 records"), with the confirm button in the danger color. "Are you sure?" with no consequence stated does not count.
- **Disabled state uses two cues**: `opacity` plus `cursor: not-allowed` (and `pointer-events: none` on custom controls). Color alone is invisible to color-blind users. Component-library `disabled` props handle this; hand-rolled disabled styling must add both classes manually.

## Hierarchy & Layout Constraints (P2: verify before handoff)

- **One primary CTA per viewport**. Every other action demotes to secondary/outline/ghost/link. A table with a filled "Edit" button on every row fails this: row actions go ghost or link style.
- **Navigation active state never relies on color alone**: pair the color with weight (`font-semibold` vs normal), an indicator bar (left rail or underline), or a background step. Blue text vs gray text alone fails accessibility.
- **Content regions cap their width**: dashboards and admin shells `max-w-7xl`; forms and detail views `max-w-2xl`/`max-w-3xl`; articles and docs `max-w-prose` (~65ch). Uncapped content on ultrawide monitors scatters into unreadable ribbons.
- **Tables scroll horizontally on narrow screens**: wrap in `overflow-x-auto` (or the library's scroll prop). Never crop columns to fit.
- **Overlays adapt on mobile**: modals go near-full-width (no side gutters forcing horizontal scroll), drawers become bottom sheets. A desktop-sized modal centered on a phone is a P2 violation.
- **Data loads slower than 300ms get a skeleton**, matching the layout's structure (rows for tables, blocks for cards, paragraphs for detail pages). A blank area for 300ms+, or content popping in and shifting layout (CLS), both fail. Spinners are for full-page transitions and indeterminate blocking waits only.

## Edge State Matrix (design every screen against all six)

For every screen, walk these six categories and decide which sub-states exist. Every state that exists answers three questions: what does the user see, what happened, what can they do next. A state that cannot answer all three is unfinished.

| Category   | Sub-states to check                                               | Rules                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty      | first-use, collection emptied, search no-result, filter no-result | Never bare "no data": say why it is empty and name the next step. first-use gets a creation CTA; search-empty suggests new keywords; filter-empty suggests clearing filters. These are different states with different copy, not one generic empty template.                                                                              |
| Loading    | initial, refresh, load-more, submit                               | Skeleton over spinner for initial loads so the page structure is visible. Submit locks the button (see P1). Tier by latency: <1s skeleton, 1-3s spinner, >3s progress plus cancel, >10s error fallback. One spinner for every duration is a red flag. Spinner here means full-page or blocking only (see the >300ms skeleton rule above). |
| Error      | network, permission, not-found, server, validation, rate-limit    | Never show raw technical errors ("Error 500", stack traces). Every error offers an action ("check your connection, retry"). Network errors preserve the user's entered data. Validation errors appear inline as the user types, not after submit.                                                                                         |
| Boundary   | zero, overflow, long-text, null                                   | Long text truncates with ellipsis + tooltip or wraps deliberately; it never breaks layout. Large numbers abbreviate (1.2K, 1.2M). Unfilled optional fields show a muted placeholder, never the literal `null`/`undefined`.                                                                                                                |
| Permission | anonymous, unauthorized, read-only, tier-limited                  | Anonymous: explain why login is needed and return the user to their intent afterward. Tier-limited: inline upgrade prompt, not a view-hijacking modal. Read-only: visibly demoted controls with an explanation ("only team members can edit").                                                                                            |
| Offline    | no-network, poor-connection, partial-sync                         | Mobile always; web where relevant. Preserve entered data locally and sync on reconnect. Announce offline state without blocking everything: cached content stays viewable, and sync status stays explicit ("3 waiting to sync").                                                                                                          |

When a screen accumulates 8+ required states, do not build each as a separate page: share one error template parameterized by copy across network/server/not-found, keep validation and long-text states inline, and ship must-tier states first.

## State Severity

- **must** (blocker if missing): anything the majority of sessions hit — initial loading, submit loading, validation errors, empty collection, network error, anonymous access on gated features. Login state, network failure, server fallback, and the first-run empty screen are critical in every product.
- **should** (ship in the first follow-up): refresh/load-more loading, filter-empty, boundary overflow, read-only mode.
- **nice-to-have**: partial-sync indicators, rate-limit messaging.

---

_Distilled from the 产品设计 plugin's ui-review (P1/P2/P3 tiers) and edge (6-category state matrix) skills; severity model adapted from its must/should/nice-to-have triage._
