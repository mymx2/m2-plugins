# Spec Mode: Write Requirements Before Code

Activate when starting a new project, feature, or significant multi-file change where no spec exists, or when requirements are ambiguous. Skip for single-line fixes and unambiguous self-contained changes.

## Scope Check (only when one request bundles several independently testable capabilities)

Decompose before specifying when a single requirement bundles several independently testable capabilities. Detection — any one is enough:

- The requirement names distinct capabilities with their own consumers or data (e.g. identity, billing, notifications, reporting)
- Acceptance criteria cluster into groups that could ship and be verified separately
- One capability could be cut or replaced without rewriting the others' requirements

Before writing any spec, propose a small **capability map** — a module table (module id, responsibility, depends-on) plus a build order, gated by human review. Stable kebab-case module ids, one-way dependency direction (cycles mean one module), interfaces living at the provider's boundary. Then recurse per module in dependency order.

## Specify

Surface assumptions **immediately** ("correct me now or I'll proceed with these"), then write a spec covering:

1. **Objective** — what we're building and why, who the user is, what success looks like.
2. **Commands** — full executable commands with flags, not just tool names.
3. **Project Structure** — where source, tests, and docs live.
4. **Code Style** — one real snippet beats three paragraphs describing it.
5. **Testing Strategy** — framework, locations, coverage.
6. **Boundaries** — Always do / Ask first / Never do.

Reframe vague requirements as concrete success criteria ("make the dashboard faster" → "LCP < 2.5s on 4G, initial load < 500ms, CLS < 0.1 … are these the right targets?").

**Gated workflow:** do not advance to the next phase until the current one is validated. The spec, the plan, and the task list each get explicit user confirmation before implementation begins.

## Plan → Tasks

- The plan identifies components, dependencies, implementation order, risks, what can parallelize, and verification checkpoints.
- Tasks are discrete, single-session, ordered by dependency (not importance), each with acceptance criteria and a verification step, none touching more than ~5 files.

## Keep the Spec Alive

Update it when decisions or scope change; commit it; reference it in PRs. The spec is a living document, not a one-time artifact.

## Rationalizations

"Simple, I don't need a spec" → simple tasks still need acceptance criteria; a two-line spec is fine. "I'll write it after I code" → that's documentation, not specification. "The spec will slow us down" → a 15-minute spec prevents hours of rework. "It's one big feature; splitting it is overhead" → a monolithic spec forces every downstream task to reason over the whole contract; a ten-line capability map is the cheap alternative. "I'll decompose during planning" → planning slices tasks within a spec; module boundaries and dependency direction must be decided before the spec is written, not after.

## Red Flags

- One spec whose requirements span several independently testable capabilities
- Module boundaries or build order decided implicitly during implementation because no capability map was approved up front
- Implementing features not mentioned in any spec or task list
- Making architectural decisions without documenting them (see `references/adr.md`)
