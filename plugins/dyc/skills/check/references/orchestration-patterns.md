# Agent Orchestration Patterns

Reference for how specialist reviewers should be composed. The governing rule: **the user (or the main session) is the orchestrator. Personas do not invoke other personas.** Skills are mandatory hops inside a persona's workflow.

This complements the Specialist Review section (which uses `persona-catalog.md` to pick reviewers): it defines _how_ those reviewers are orchestrated.

## Endorsed Patterns

1. **Direct invocation (no orchestration)** — single persona, single perspective, single artifact. The default and cheapest. Use when the work is one perspective on one artifact describable in one sentence.
2. **Single-persona slash command** — a command that wraps one persona with the project's skills. Use when the same single-persona invocation repeats. Anti-signal: if the command body is mostly "decide which persona to call," delete it.
3. **Parallel fan-out with merge** — multiple personas operate on the same input concurrently; a merge step in the main context synthesizes a decision. Use when sub-tasks are genuinely independent, each benefits from its own context window, and the merge fits in the main context. Validate: independent? different _kinds_ of findings? merge fits? latency worth it? If any answer is no, fall back to direct invocation.
4. **Sequential pipeline as user-driven commands** — the user runs commands in order, carrying context between them. No orchestrator agent; the user is the orchestrator. Use when the workflow has dependencies and human judgment between steps adds value.
5. **Research isolation** — spawn a read-only research sub-agent that returns only a digest, keeping the main context focused. Use when the investigation result is much smaller than the input it consumes.

## Anti-Patterns

- **A. Router persona ("meta-orchestrator")** — a persona whose job is to decide which other persona to call. Pure routing with no domain value; adds paraphrasing hops and 2x token cost. Do it with slash commands / intent mapping instead.
- **B. Persona that calls another persona** — a reviewer that internally invokes another specialist. Defeats single-perspective design; loses context; multiplies failure modes. Instead, _recommend_ a follow-up audit in the report; the user or a command runs the second pass.
- **C. Sequential orchestrator that paraphrases** — an agent that runs the whole spec → plan → build sequence on the user's behalf. Loses human checkpoints, accumulates drift, doubles token cost. Keep the user as orchestrator.
- **D. Deep persona trees** — a top-level command calls a coordinator that calls a quality-coordinator that calls reviewers. Each layer adds latency/tokens with no decision value. Keep orchestration depth at most 1 (command → personas); merge in the main agent.

## Decision Flow

```
Is the work one perspective on one artifact?
├── Yes → Direct invocation. Stop.
└── No  → Will the same composition repeat?
         ├── No  → Direct invocation, ad hoc. Stop.
         └── Yes → Are sub-tasks independent?
                  ├── No  → Sequential slash commands run by user (Pattern 4).
                  └── Yes → Parallel fan-out with merge (Pattern 3); validate checklist,
                           else fall back to single-persona command (Pattern 2).
```
