# Incremental Guardrails

These are the review-time guardrails for any multi-file change that went through implementation. Load when reviewing a change that touches more than one file or lands in multiple slices.

## Guardrails

- **One thing at a time.** Each commit/increment changes one logical thing; don't mix a new component, a refactor, and a build-config change in one commit.
- **Keep it compilable.** After each increment the project must build and existing tests must pass — no broken state between slices.
- **Feature flags for incomplete features.** If a feature isn't ready for users, merge it behind a flag rather than exposing incomplete work.
- **Safe defaults.** New code defaults to safe, conservative behavior (opt-in, disabled by default).
- **Rollback-friendly.** Additive changes are easy to revert; keep modifications to existing code minimal and focused; DB migrations have rollback migrations; don't delete and replace in the same commit.

## Slicing Strategies

- **Vertical slices (preferred).** Each slice is one complete path through the stack (DB + API + UI) that delivers working end-to-end functionality — e.g. CRUD lands as create → list → edit → delete, each independently testable.
- **Contract-first slicing.** When backend and frontend develop in parallel: slice 0 defines the API contract (types, OpenAPI spec); backend implements against it while frontend builds against mock data matching it; final slice integrates.
- **Risk-first slicing.** Tackle the riskiest or most uncertain piece first (e.g. prove the WebSocket connection before building on it). If the risky slice fails, you discover it before investing in the rest.

## Verification Command Discipline

Run each verification command after a change that could affect it. After a successful run, don't repeat the same command unless the code has changed since — re-running on unchanged code adds no information, and running it "just to be sure" is reassurance, not verification.

## Scope Discipline

Touch only what the task requires. Don't "clean up" adjacent code, refactor imports in files you're not modifying, remove comments you don't understand, add features "because they seem useful", or modernize syntax in files you're only reading. If you notice something worth improving outside scope, note it — don't fix it.

## Simplicity

Before writing code: "What is the simplest thing that could work?" Review against: can this be fewer lines? are these abstractions earning their complexity? am I building for hypothetical future requirements? **Three similar lines is better than a premature abstraction.** Implement the naive, obviously-correct version first; optimize only after correctness is proven by tests.

## Autonomous Execution Guardrails

When a plan is executed in an approved, one-gate autonomous pass (user approves the full plan once, then the agent runs task after task without stopping between them):

- **Never invent requirements.** A real spec must exist first (`SPEC.md` at the repo root, `docs/SPEC.md`, or under `spec/`); a README or arbitrary doc does not count. If none exists, stop and say so rather than generating requirements.
- **Establish a clean baseline** before starting. If there are unrelated uncommitted changes, stop and ask how to handle them — autonomous per-task commits must not absorb unrelated local work, or the clean-rollback guarantee breaks. Planning artifacts (`SPEC.md`, `docs/SPEC.md`, `spec/*`, `tasks/plan.md`, `tasks/todo.md`) are expected and don't trip this stop.
- **Commit the plan first.** If the run produced a plan file (`tasks/plan.md`), land it as its own preparatory commit before the first task commit, so it never mixes into a task's rollback point.
- **One commit per task, staged precisely.** Commit each task's files (and only that task's files plus its status update); never `git add -A` blindly — that keeps every commit a clean rollback point.
- **Execute in dependency order.** Run tasks in their declared dependency order; where no dependency is declared, fall back to plan order.
- **One human checkpoint, then run.** Present the plan once and wait for an unambiguous yes ("approve"/"go"). Treat "looks reasonable" or "I guess" as not approved. All other decisions happen in-code; resume from the next pending task after a blocker is resolved.
- **Stop and ask (do not push through) when:** a test can't be made to pass or the build breaks without an obvious fix; the spec is ambiguous or a task needs a decision it doesn't cover; or a task is high-risk/irreversible (auth/permission changes, destructive migrations, payments, deletions, secret-touching). Get explicit sign-off before continuing.

## Red Flags

- > 100 lines written before running tests
- Multiple unrelated changes in one increment
- "Let me just quickly add this too" scope expansion
- Build or tests broken between increments
- Abstractions built before the third use case
- New utility files for one-time operations
- The same build/test command run twice in a row without any intervening code change
