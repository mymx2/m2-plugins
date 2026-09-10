# Gesture Physics: Drag, Swipe, Sheet, Carousel

Load when building or modifying gesture-driven surfaces: drag-to-dismiss sheets and drawers, swipeable carousels, sliders, sortable lists, or any interaction where a finger or pointer positions an element and then releases it. The judgment here is platform-independent physics; the idioms are web (Pointer Events, springs). For native surfaces, apply the same judgment through the mapping table in the design-native-motion reference.

The through-line: a gesture-driven interaction feels alive when the element tracks the pointer 1:1 during the drag, and the release animation continues at the pointer's exact velocity toward a target chosen by projecting that velocity forward. The seam between "user is dragging" and "system is animating" is where these interactions fail; every rule below exists to hide that seam.

## 1:1 Tracking

- Use Pointer Events with `setPointerCapture` on `pointerdown`, so tracking continues when the pointer leaves the element bounds, crosses iframes, or lifts outside the window edge.
- Respect the grab offset: keep the element at `pointer − grabPoint`, never snap the element's center to the pointer. Center-snapping breaks the illusion of holding the object instantly.
- Track a short position+timestamp history (the last few `pointermove` events), not just the current point. The release velocity comes from that history; a single sample of `(last − current) / dt` is noisy.
- Update the UI on every `pointermove`, 1:1 with no threshold after the gesture commits. Feedback that only arrives when the gesture completes reads as dead.

```js
const history = []
el.addEventListener('pointerdown', e => {
  el.setPointerCapture(e.pointerId)
  const grabOffset = e.clientY - el.getBoundingClientRect().top
  // per move: history.push({ y: e.clientY, t: e.timeStamp })
})
```

## Interruptibility

A user must be able to grab a moving element mid-flight and reverse it without waiting for the animation to finish. A closing sheet the user re-grabs should follow the finger, not finish closing first and reopen.

- Never lock out input during a transition; the gesture handlers stay active while the settle animation runs.
- Animate from the current on-screen (presentation) value, never the logical target value. On interrupt, read the element's live transform and start from there; starting from the target causes a visible jump.
- Avoid CSS transitions and `@keyframes` for gesture-driven settle: they cannot be grabbed and reversed mid-flight. Springs retarget from the current value by default, which is what interruption needs.
- On reversal, blend velocity instead of hard-cutting it. Swapping one animation for another at a reversal creates a velocity discontinuity (a brick wall); use a spring library that carries velocity through a retarget. This also means the "interruptible animations prefer CSS transitions" rule from the design-reference reference is scoped to non-gesture state changes (hover, toggle, open/close); gesture settle is the exception.
- Decompose 2D motion into independent X and Y springs. One spring on a 2D distance desyncs when the axes have different velocities.

## Velocity Handoff

When the gesture ends, the settle animation must continue at the pointer's exact release velocity, computed from the tracked history. This is the detail that most separates "fluid" from "fine": the first frame after release moves at the same speed the finger just left.

Motion / Framer Motion take absolute px/s directly (`velocity` option). APIs that want relative velocity normalize it by the remaining distance:

```
relativeVelocity = gestureVelocity / (target − currentValue)
```

Example: element at `y=50`, target `y=150` (100px remaining), finger at 50px/s → initial velocity `0.5`.

Compute the release velocity from the last few samples (a ~100ms window), not the final `pointermove`; a single sample catches finger-lift tremor and spikes.

## Momentum Projection

Snap targets come from where the gesture is going, not where it stopped. Project the resting position from the release velocity (exactly like scroll deceleration), then choose the snap target nearest the projected point. This is what makes a flick feel like it throws the element; snapping from the raw release point makes a hard flick land on the adjacent slot and reads as the gesture being ignored.

```
projected = current + (v / 1000) · d / (1 − d)    // d = deceleration rate
```

- `d ≈ 0.998` for a normal scroll feel; `0.99` for snappier.
- The textbook `v²/(2·decel)` is not what shipped systems use; use the exponential-decay form above.
- Hand off the release velocity to the settle spring (previous section) after choosing the target from the projection. Projection picks the target; velocity handoff animates to it.
- This is the standard behavior in good bottom-sheets and carousels (Vaul, Embla); when adopting one, verify it projects and hands off velocity rather than snapping from release position.

## Commit vs. Reverse: Velocity Sign, Not Position

At release, decide commit or reverse from the velocity sign, not from how far the element has traveled. A slow drag that covers most of the distance should still reverse (the user was moving back); a fast short flick should commit. Combine as: velocity sign decides when |v| exceeds a small threshold (roughly 50-500px/s depending on surface); below it, position takes over (past halfway commits).

## Soft Boundaries: Rubber-Banding

At a scroll or drag edge, resist progressively instead of stopping hard. A hard stop reads as "frozen"; continuous resistance reads as "responsive, but there is nothing more here". The further past the bound the pointer goes, the less the element follows:

```js
// dimension = viewport or track size in the drag axis; constant ≈ 0.55
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}
```

Apply the same damping on the way back so releasing an overstretched boundary settles home. Rubber-band resistance is also cheap intent feedback that the boundary exists, which a hard stop communicates only by pain.

## Gesture Disambiguation

- Require a small movement threshold (~10px) before committing to a drag direction; below it, the input is a tap, and cancel-by-dragging-away-and-back must remain possible.
- Recognize all plausible gestures in parallel from the first move and cancel the losers once intent is clear. Avoid `swipeleft`-style recognizers that only report a final state: they throw away the continuous tracking that 1:1 feedback needs.
- Minimize disambiguation delay. Double-tap detection unavoidably delays single taps; only pay that cost where double-tap truly exists.

## Springs for Gesture Surfaces

Two designer-facing parameters beat the physics triplet (mass/stiffness/damping):

- **Damping** (or `bounce`): `1.0` / `0` is critically damped, no overshoot. Below that, overshoots and oscillates; lower is bouncier.
- **Response** (or `duration`): how quickly the value reaches the target, in seconds. Lower is snappier. This is not a fixed duration; a spring's settle time emerges from the parameters plus the initial velocity.

Defaults: critically damped for motion the system starts on its own; slight bounce (damping ~`0.8`, or `bounce` 0.1-0.3) only when the gesture carried momentum (a flick, a throw, a release), consistent with the bounce exception in the design-reference reference. A sheet that settles with the finger's velocity does not need overshoot to feel physical; the incoming velocity is the physicality. When in doubt between the two, the presence of release velocity is the tiebreaker.

## Reduced Motion Under Gestures

Reduced motion is a degradation of the settle, never of the gesture: the drag itself is user-driven input and stays 1:1 (it is the user's own motion, not imposed motion). Degrade the release: replace the spring settle with a short opacity-free cross-fade or an instant snap (under ~100ms), drop all overshoot, and keep the momentum projection logic so the flick still lands where the flick was going. Do not degrade a drag into tap-arrows: that removes the interaction rather than the motion. Also avoid slow looping oscillations (~0.2Hz) and full-viewport moving backgrounds on any surface, reduced-motion or not.

```css
@media (prefers-reduced-motion: reduce) {
  .sheet {
    transition: transform 80ms ease-out;
  }
}
```

## Verification

Gesture feel is verified by interacting, not by reading code: drag the surface through a full commit, a full reverse, a mid-flight re-grab, and an overstretched boundary, in a real browser (input synthesis guidance in the browser-devtools reference). Two defects dominate and are invisible in source: the release seam (element visibly stops then restarts when the finger lifts) and the re-grab jump (element teleports when grabbed mid-settle). A drag implementation shipped without exercising both is a claim, not a verification.
