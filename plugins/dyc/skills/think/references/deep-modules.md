# Deep Modules: Design Vocabulary for Leverage and Locality

Load when the plan designs or restructures a module's interface, when you are deciding where a boundary belongs, when code is hard to test or hard for an agent to navigate, or when a refactor promises "cleaner architecture." A shared vocabulary keeps the design conversation honest: without it, "component," "service," "API," and "boundary" blur into noise.

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. The aim is leverage for callers, locality for maintainers, and testability for everyone.

## Glossary

Use these terms exactly; don't substitute "component," "service," "API," or "boundary." Consistent language is the whole point.

- **Module**: anything with an interface and an implementation. Deliberately scale-agnostic: a function, class, package, or tier-spanning slice. _Avoid_: unit, component, service.
- **Interface**: everything a caller must know to use the module correctly: the type signature, but also invariants, ordering constraints, error modes, required configuration, and performance characteristics. _Avoid_: API, signature (too narrow — those are only the type-level surface).
- **Implementation**: what's inside a module. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake).
- **Depth**: leverage at the interface — how much behaviour a caller (or test) can exercise per unit of interface they must learn. A module is **deep** when a lot of behaviour sits behind a small interface, **shallow** when the interface is nearly as complex as the implementation.
- **Seam** _(Michael Feathers)_: a place where you can alter behaviour without editing in that place; the location at which a module's interface lives. Where to put the seam is its own decision, distinct from what goes behind it. _Avoid_: boundary (overloaded with DDD's bounded context).
- **Adapter**: a concrete thing that satisfies an interface at a seam. Describes role (what slot it fills), not substance (what's inside).
- **Leverage**: what callers get from depth — more capability per unit of interface learned. One implementation pays back across N call sites and M tests.
- **Locality**: what maintainers get from depth — change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers. Fix once, fixed everywhere.

## Deep vs Shallow

```
Deep module                    Shallow module (avoid)
┌─────────────────────┐        ┌─────────────────────────────────┐
│   Small Interface   │        │       Large Interface           │
├─────────────────────┤        ├─────────────────────────────────┤
│                     │        │  Thin Implementation            │
│  Deep Implementation│        │  (just passes through)          │
│                     │        └─────────────────────────────────┘
└─────────────────────┘
```

When designing an interface ask: can I reduce the number of methods? Simplify the parameters? Hide more complexity inside?

## Principles

- **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, mockable, swappable parts; they just aren't part of the interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through. If it reappears across N callers, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. If you want to test _past_ the interface, the module is probably the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam unless something actually varies across it (typically production + test).

## Designing for Testability

Good interfaces make testing natural:

1. **Accept dependencies, don't create them.** `processOrder(order, gateway)` is testable; `processOrder(order)` that news up its own gateway is not.
2. **Return results, don't produce side effects.** `calculateDiscount(cart): Discount` over `applyDiscount(cart): void`.
3. **Small surface area.** Fewer methods means fewer tests; fewer params means simpler setup.

## Deepening a Cluster: Classify Dependencies First

When deepening a set of shallow modules, classify each dependency — the category decides how the deepened module is tested across its seam:

1. **In-process** (pure computation, in-memory, no I/O): always deepenable. Merge and test through the new interface directly; no adapter.
2. **Local-substitutable** (has a local test stand-in, e.g. PGLite for Postgres, in-memory FS): deepenable; test with the stand-in. Seam stays internal.
3. **Remote but owned** (your own microservice / internal API): define a **port** at the seam; the deep module owns the logic, transport is an injected adapter. Tests use an in-memory adapter; production uses HTTP/gRPC/queue.
4. **True external** (third-party you don't control): inject as a port; tests provide a mock adapter.

**Testing strategy: replace, don't layer.** Old unit tests on shallow modules become waste once tests exist at the deepened interface — delete them. New tests assert observable outcomes through the interface, not internal state, so they survive internal refactors. Keep internal seams private; don't expose them just because tests use them.

## Designing an Interface: Design It Twice

For a significant interface, don't settle for the first idea. Spin up parallel design attempts, each under a different constraint:

- Minimise the interface (1–3 entry points, maximise leverage per entry point).
- Maximise flexibility (many use cases, extension).
- Optimise for the most common caller (make the default case trivial).
- Design around ports & adapters for cross-seam dependencies.

Compare candidates on **depth** (leverage at the interface), **locality** (where change concentrates), and **seam placement**. Then recommend one, with reasoning — and propose a hybrid if elements combine well. Be opinionated; the user wants a strong read, not a menu. (This is the design-side analogue of the multi-perspective plan pattern in the parent skill.)

## Red Flags

- An interface nearly as complex as its implementation (shallow)
- Pure functions extracted "for testability" while the real bugs hide in how callers combine them (no locality)
- A seam with a single adapter (indirection without payoff)
- Tests that break on internal refactors (testing past the interface)
- Recommending "a service layer" without naming the seam, the depth, and the leverage
