# Visual Comparison: Judgment — Modes, Thresholds, Meaningful Failures, Baselines

Canonical home for visual-diff judgment in this skills tree. Load when two captures exist and someone must decide what the diff means: visual regression against an approved baseline, or conformance against a design reference (Figma export, prototype image, handoff screenshot). The browser-side capture mechanics (viewport pinning, animation killing, time freezing, masking implementation) live in the chrome skill's `visual-comparison` reference; this file is the normative source for interpretation and decisions.

## Two Modes, Two Strictness Levels

- **Regression**: expected image is a previously approved baseline from the same app pipeline. Same renderer on both sides, so approval is strict: almost any unexplained diff is suspect.
- **Conformance**: expected image is designer-owned (Figma, prototype). Different renderers on each side, so approval needs interpretation: font rasterization, shadow/blur, and blend-mode differences are expected and are not findings.

Name the mode before comparing; the same diff ratio means different things in each.

## Masking Judgment

The chrome reference covers how to mask mechanically. The judgment side:

Mask (exclude from diff) what is legitimately dynamic:

- avatars and user-uploaded media
- timestamps, counters, live metrics
- ads, maps, randomized illustrations, charts on live data
- cursor/caret and text selection
- skeleton shimmer and loading animation

Never mask what the comparison exists to protect:

- primary CTA position and emphasis
- copy that should match the design verbatim
- layout containers (masking these hides overflow regressions)
- state indicators under test
- broken images or missing icons

When in doubt, do not mask. A false positive costs a minute of inspection; a masked regression ships.

## Reading the Diff

Raw diff ratio is a triage signal, not a verdict:

| Diff ratio | Reading                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| 0–0.5%     | likely acceptable; spot-check high-impact areas                                                                |
| 0.5–2%     | inspect layout, typography, color, and asset regions                                                           |
| 2–5%       | likely major unless explained by known dynamic content                                                         |
| >5%        | blocker for regression mode; in conformance mode, check whether content/data mismatch dominates before judging |

Never rule by percentage alone: a 0.3% diff sitting on a destructive CTA or a price outweighs a 6% diff inside a decorative image. Locate the diff region before assigning severity.

## Common False Positives (check before reporting)

- subpixel anti-aliasing and OS/browser/font rasterization differences
- font fallback or a missing font weight
- Figma-only rendering: shadow, blur, gradient, blend-mode approximations
- scrollbar present in one environment only
- line wrapping differences from real content vs mock copy
- image compression or CDN transforms
- dynamic content that should have been masked
- sticky headers captured at different scroll offsets

## Meaningful Failures (these are always findings)

Missing or extra visible element; wrong hierarchy or CTA emphasis; wrong semantic color or status state; layout shift, overflow, clipping, broken wrapping; type scale or line-height mismatch hurting readability; spacing changes that regroup content; wrong asset, icon size, crop, or aspect ratio; a state absent from the capture; responsive layout diverging from design intent.

## Baseline Policy

Update a baseline only when the visual change is intentional, the design owner or reviewer approved it, the new baseline is generated in the same deterministic environment, and the report states what changed and why. Never regenerate a baseline to make a regression disappear.

---

_Distilled from the design-review plugin's visual-comparison-guide (modes, masking, thresholds, false positives, baseline policy)._
