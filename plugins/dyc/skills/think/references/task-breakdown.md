# Task Breakdown: Decompose Work into Verifiable Tasks

Activate when you have a plan/spec and need implementable units, when a task feels too large to start, or when work needs parallelizing. Skip for single-file changes with obvious scope.

## Process

1. **Map the dependency graph.** Identify what depends on what (schema → API → client → UI). Implementation order follows bottom-up.
2. **Slice vertically, not horizontally.** Build one complete feature path at a time (schema + API + UI for _one_ user flow) rather than all the database, then all the API, then all the UI. Each slice leaves the system working and testable.
3. **Declare blocking edges.** For each task name the other tasks that must complete before it can start; a task with no blockers can start immediately. The **frontier** is every task whose blockers are all done — work the frontier, not a flat list.
4. **Write each task with:** a short descriptive title, acceptance criteria (specific, testable, ≤3 bullets), a verification step (repo's test/build command or manual check), its blocking edges, and files likely touched.
5. **Order and checkpoint.** Dependencies first, high-risk tasks early (fail fast), verification checkpoints after every 2–3 tasks, each task leaves the system working.

**Wide refactors are the exception to vertical slicing.** A wide refactor is one mechanical change (rename a column, retype a shared symbol) whose blast radius fans across the whole codebase, so no single vertical slice can land green. Don't force it into a slice; sequence it as **expand–contract**:

1. **Expand** — add the new form beside the old so nothing breaks.
2. **Migrate** — move call sites over in batches sized by blast radius (per package, per directory), each batch its own task blocked by the expand, keeping CI green batch to batch because the old form still exists.
3. **Contract** — delete the old form once no caller remains, in a task blocked by every migrate batch.

When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify task; green is promised only there.

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

**Confirm the breakdown before publishing.** Present the proposed tasks and ask: does the granularity feel right (too coarse / too fine)? Are the blocking edges correct — does each task depend only on tasks that genuinely gate it? Should any be merged or split? Iterate until the user approves.

Avoid specific file paths or code snippets in task bodies: they go stale fast. Exception — if a prototype produced a snippet that encodes a decision more precisely than prose can (a state machine, reducer, schema, or type shape), inline just the decision-rich part and note it came from a prototype.

## Parallelization

Safe to parallelize: independent feature slices, tests for implemented features, docs. Must be sequential: DB migrations, shared-state changes, dependency chains. Needs coordination: features sharing an API contract (define the contract first, then parallelize).

## When the Work Is Still Fog

Task breakdown assumes the work can be sliced now. When it can't — the way from here to the destination isn't visible yet, only a dim sense of decisions ahead — don't pre-slice the fog into fake tasks. Hold it as a **not-yet-specified** list: the suspected questions and areas to revisit, written as loosely as the view allows.

The test for whether something is a task or still fog is whether you can state the _question_ precisely now, not whether you can _answer_ it:

- **Task when** the question is already sharp, even if it's blocked and you can't act on it yet.
- **Not yet specified when** you can't yet phrase it that sharply. One patch of fog may graduate into several tasks, or none, once the frontier reaches it.

Resolving a sharp task clears the fog ahead of it; graduate whatever's now specifiable into fresh tasks, one at a time, and clear each graduated patch from the not-yet-specified list. Work beyond the destination isn't fog — it's out of scope and stays off the list entirely.

## Rationalizations

"I'll figure it out as I go" → that's how you end up with a tangled mess. "The tasks are obvious" → write them down anyway; explicit tasks surface hidden dependencies. "Planning is overhead" → planning is the task; implementation without a plan is just typing.
