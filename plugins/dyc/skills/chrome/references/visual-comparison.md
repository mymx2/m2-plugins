# Visual Comparison: Deterministic Capture Mechanics

Load when a task captures screenshots that will be compared: visual regression against a baseline, or conformance against a design reference. This file owns only the browser-side mechanics that make two captures comparable. Diff interpretation, pass/fail thresholds, meaningful-failure judgment, and baseline update policy belong to the ui skill's `visual-comparison` reference — route there once both images exist. If the ui skill is not installed, stop after capture is complete and hand the judgment back to the user.

## Deterministic Capture Protocol

Two captures are comparable only when everything non-visual is pinned. Before shooting either side:

1. Match viewport dimensions to the baseline or design frame; set `deviceScaleFactor` deliberately (`emulate --viewport "1920x1080x2"` or `resize_page`).
2. Kill animation: the `emulate` tool does **not** cover `prefers-reduced-motion` (its schema is network, CPU, geolocation, user agent, color scheme, viewport, extra HTTP headers only). Inject CSS via `evaluate_script` instead:

   ```js
   ;() => {
     const s = document.createElement('style')
     s.textContent =
       '* { animation: none !important; transition: none !important; caret-color: transparent !important }'
     document.head.appendChild(s)
   }
   ```

   This also hides the text caret. The SKILL.md script-safety rule applies; prefer a fresh isolated profile when the target page carries authenticated state.

3. Freeze time and randomness: inject a fixed `Date` via `evaluate_script` before page scripts that render timestamps run, and use deterministic seed data where the app supports it. The same injection safety rule applies.
4. Wait for stability, not a fixed sleep: `wait_for` a known-content selector, and let network go idle before capture.
5. Keep browser, OS, and installed fonts constant across the two captures; if a production font is missing locally, document the fallback instead of treating its rendering delta as a regression.
6. Compare at identical pixel dimensions.

## Masking Mechanics

Mask (exclude from diff) what is legitimately dynamic. Mechanically, masking means either removing the region before capture or stabilizing it:

- hide or restyle dynamic regions via `evaluate_script` CSS injection (avatars, timestamps, live counters, ads, maps, charts on live data, skeleton shimmer)
- hide cursor/caret and text selection with the injection in step 2
- capture at the same scroll offset so sticky headers align

Which regions are legitimate to mask versus which the comparison exists to protect is a judgment call owned by the ui skill. When in doubt, do not mask: a false positive costs a minute of inspection; a masked regression ships.

## Handoff

Once both captures exist, stop operating the browser and switch to judgment: load the ui skill's `visual-comparison` reference for mode selection (regression vs conformance), diff-ratio reading, false-positive triage, meaningful failures, and baseline update policy.

---

_Capture mechanics adapted from the design-review plugin's capture-ui-screenshot protocol (reduced-motion injection, frozen Date, stability waits). Judgment content lives in the ui skill._
