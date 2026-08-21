# Task Breakdown: Decompose Work into Verifiable Tasks

Activate when you have a plan/spec and need implementable units, when a task feels too large to start, or when work needs parallelizing. Skip for single-file changes with obvious scope.

## Process

1. **Map the dependency graph.** Identify what depends on what (schema → API → client → UI). Implementation order follows bottom-up.
2. **Slice vertically, not horizontally.** Build one complete feature path at a time (schema + API + UI for _one_ user flow) rather than all the database, then all the API, then all the UI. Each slice leaves the system working and testable.
3. **Write each task with:** a short descriptive title, acceptance criteria (specific, testable, ≤3 bullets), a verification step (repo's test/build command or manual check), dependencies, and files likely touched.
4. **Order and checkpoint.** Dependencies first, high-risk tasks early (fail fast), verification checkpoints after every 2–3 tasks, each task leaves the system working.

## Output

Planning is read-only: research and write the plan, don't write implementation code during planning. Record the plan in a file (e.g. `tasks/plan.md`) and the task list in one canonical place — default `tasks/todo.md`; if the project has a designated external tracker, use it instead, never both. Keep the plan's task list section as an ordered index into that tracker.

## Sizing

| Size | Files | Scope                                |
| ---- | ----- | ------------------------------------ |
| XS   | 1     | Single function/config change        |
| S    | 1–2   | One component or endpoint            |
| M    | 3–5   | One feature slice                    |
| L    | 5–8   | Multi-component feature — break down |
| XL   | 8+    | Too large — always break down        |

Break a task down further if it would take more than one focused session, you can't describe acceptance criteria in ≤3 bullets, it touches two independent subsystems, or the title contains "and".

## Parallelization

Safe to parallelize: independent feature slices, tests for implemented features, docs. Must be sequential: DB migrations, shared-state changes, dependency chains. Needs coordination: features sharing an API contract (define the contract first, then parallelize).

## Rationalizations

"I'll figure it out as I go" → that's how you end up with a tangled mess. "The tasks are obvious" → write them down anyway; explicit tasks surface hidden dependencies. "Planning is overhead" → planning is the task; implementation without a plan is just typing.
