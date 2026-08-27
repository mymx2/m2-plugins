# Domain Language: Sharpen the Project Glossary Inline

Load when the plan or discussion turns on project-specific terminology, when a term is being used loosely or contradicts existing usage, or when you are about to name a module, seam, or concept the codebase will live with. A shared, opinionated vocabulary is what lets agents and humans stop re-explaining jargon every session.

Distinct from the `adr` reference: ADRs record _decisions_; this reference maintains the _language_ those decisions are written in. Merely reading a glossary for vocabulary is a one-line habit any skill can do — this reference is for when you are actively changing the model, not just consuming it.

## The Glossary File

Keep a `CONTEXT.md` glossary at the repo root (or per-context, below). It is a glossary and nothing else — no spec, no scratch pad, no implementation decisions.

```md
# {Context Name}

{One or two sentences: what this context is and why it exists.}

## Language

**Order**:
{One or two sentences: what the term IS.}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request
```

## Rules

- **Be opinionated.** When several words name the same concept, pick the best one and list the rest under `_Avoid_`. One canonical term per concept; synonyms are how agents drift into twenty words where one would do.
- **Define what it IS, not what it does.** One or two sentences, tight. Behavior and flow belong in code and ADRs.
- **Only project-specific terms.** General programming concepts (timeouts, error types, utility patterns) don't belong, however heavily used. Before adding a term ask: is this unique to this context, or a general concept? Only the former earns a place.
- **No implementation detail.** A glossary entry names a domain concept, never a class, table, or file. If the entry reads like a spec, it has leaked out of the glossary.
- **Group under subheadings** when natural clusters emerge; a flat list is fine for one cohesive area.
- **Create lazily.** No `CONTEXT.md` until the first term is resolved; no section until it has an entry.

## Multi-Context Repos

Most repos have one context: a single root `CONTEXT.md`. When a `CONTEXT-MAP.md` exists at the root, the repo has several; the map lists each context, where it lives, and how contexts relate (events emitted, shared types). Infer which context the current topic belongs to; if unclear, ask before writing a term into the wrong one.

## The Active Discipline

Reading the glossary is passive. The active work is keeping it sharp, in the moment language is being used:

1. **Challenge against the glossary.** When a term the user uses conflicts with `CONTEXT.md`, call it out immediately: "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"
2. **Sharpen fuzzy language.** When a term is vague or overloaded, propose a precise canonical one: "You're saying 'account' — do you mean the Customer or the User? Those are different things."
3. **Stress-test with scenarios.** When domain relationships are being discussed, invent edge-case scenarios that force precision about the boundaries between concepts.
4. **Cross-reference with code.** When a stated behavior contradicts what the code does, surface it: "Your code cancels entire Orders, but you said partial cancellation is possible. Which is right?"
5. **Update inline, not batched.** The moment a term resolves, write it into `CONTEXT.md` right there. Deferred glossary updates don't happen.

## Payoff

A sharp glossary compounds: variables, functions, and files get named from the shared language; the codebase becomes easier for an agent to navigate; the agent spends fewer tokens re-deriving jargon it can read once. "There's a problem with the materialization cascade" is one line that replaces a paragraph of explanation, session after session.

## Red Flags

- A term added with several synonyms left in active use, no `_Avoid_` list
- Glossary entries that describe behavior or cite classes/tables instead of naming a concept
- General programming vocabulary padding the glossary
- Resolving a term in conversation but never writing it down
- A `CONTEXT.md` that has drifted from the code and is silently wrong
