---
name: learn
description: 'Runs a six-phase research workflow that turns unfamiliar domains, source bundles, or collected material into publish-ready output. Use when users ask for multi-source research: deep-dives, compiling sources, synthesizing unfamiliar material, or turning a source bundle into a coherent reference. Not for quick lookups or single-URL fetches (route to read).'
when_to_use: '深入研究, 学习一下, 整理成文章, 一站式参考, 一篇就够, 技术选型调研, 对比调研, research, deep dive, help me understand, compile sources, unfamiliar domain'
---

# Learn: From Raw Materials to Published Output

Support the user's thinking; do not replace it.

## Overview

Learn runs a six-phase research workflow: collect primary sources, digest them into a mental model, outline, fill in, refine, and self-review. The output is a publish-ready article, canonical reference, or structured notes set.

## Outcome Contract

- Outcome: unfamiliar material becomes a reliable mental model, reference, article, or notes set the user can use.
- Done when: primary sources are collected or supplied, contradictions are handled explicitly, and the final structure teaches the topic without hiding uncertainty.
- Evidence: source URLs or files, fetched content, notes from digestion, outline decisions, and self-review against the requested output.
- Output: research notes, outline, publish-ready draft, or canonical reference, matching the chosen mode.
- Authorization: research and drafting only. No publishing, no external posting, no code changes without current-turn approval.

## When to Use

- Multi-source research that produces a new structured output (article, reference, notes set).
- Turning unfamiliar domains or collected materials into publish-ready content.
- Building a canonical reference that covers a topic so thoroughly readers need nothing else.
- Route to `read` for single-URL fetches; route to `think` for planning without research; route to `write` for prose polishing without research; route to `pm` for product deliverables (PRD, backlog ranking) and product/market competitive analysis with fixed PM frameworks.

## Pre-check

Check whether the `read` and `write` skills are available in the current registered-skills list. Warn if missing, do not block:

- `/read` missing -- Phase 1 fetch falls back to native `WebFetch` / `curl`; coverage on paywalled, JS-heavy, and Chinese-platform pages degrades.
- `/write` missing -- Phase 5 AI-pattern stripping falls back to manual scan. Phases 1-4 are unaffected.

## Choose Mode

Infer the mode from the requested artifact and supplied materials. Ask only when plausible modes would change the scope or deliverable and the user's intent does not resolve the choice:

| Mode                  | Goal                                                                    | Entry   | Exit                                    |
| --------------------- | ----------------------------------------------------------------------- | ------- | --------------------------------------- |
| **Deep Research**     | Understand a domain well enough to write about it                       | Phase 1 | Phase 6: publish-ready draft            |
| **Quick Reference**   | Build a working mental model fast, no article planned                   | Phase 2 | Phase 2: notes only                     |
| **Write to Learn**    | Already have materials, force understanding through writing             | Phase 3 | Phase 6: publish-ready draft            |
| **Canonical Article** | One article that covers a topic so thoroughly readers need nothing else | Phase 1 | Phase 6: single authoritative reference |

If unsure, suggest Quick Reference.

## Reference Library

`references/research-techniques.md` has one section per row below; load the file when any row applies (each row lists the observable task shape and the section it activates). The anti-patterns gate always applies at Phase 6 regardless of whether the file was loaded earlier — the gate checklist is inlined there.

| Task shape (user-observable)                                                    | File + section                                                    |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Question still fuzzy, landscape unknown, need angles to explore                 | `references/research-techniques.md` — Divergence Tools            |
| Sources conflict or vary in reliability, material piling up                     | `references/research-techniques.md` — Convergence Tools           |
| Comparing external entities: libraries, tools, vendors, approaches, competitors | `references/research-techniques.md` — Comparing External Entities |
| Phase 6 gate (always applies, checklist inlined in Phase 6)                     | `references/research-techniques.md` — Research Anti-Patterns      |

## Canonical Article Mode

Activate when the user wants a single authoritative reference on a topic — the canonical article no one needs to search beyond.

Goal: after reading the article, no one should need to search for anything else on this topic.

Additional requirements on top of standard Deep Research:

- Every major sub-topic must have its own section; nothing left as a footnote
- Include worked examples, not just principles
- Cover common mistakes and how to avoid them
- Add a "Further Reading" section with the 3-5 sources that go deepest; flag which ones are the best starting points
- Phase 6 self-review must confirm: "Could a reader implement/understand this from this article alone?"

## Phase 1: Collect

Collect papers, official blogs, builder posts, and canonical repos.

Three ordered steps per source:

1. **Discover** -- use an installed search plugin (e.g., PipeLLM) to map the landscape, then deep-search the 2-3 most promising sub-topics. No plugin: use the environment's native web search. Output is a URL list; do not fetch content here.
2. **Fetch** -- every URL goes through `/read` when available; fall back per Pre-check when it is not.
3. **File** -- ask `read` to save fetched content to disk and return the saved path; if `read` does not support a caller-specified directory, use its default location and move the files afterwards. Move or index saved files into sub-topic directories after fetch returns. Move, don't refetch.

Target: 5-10 sources for a blog post, 15-20 for a deep technical survey.

## Phase 2: Digest

Work through the materials. For each piece: read it fully, keep what is good, cut ruthlessly what is not. Material that is not primary-source (summaries, vendor blogs, secondhand reports) enters the digest with a medium or low confidence label per the confidence grading in `references/research-techniques.md` — Convergence Tools.

Distill only claims specific enough that not any expert would say them.

## Phase 3: Outline

Write the outline for the article. For each section: note the source materials it draws from. If a section has no sources, either it does not belong or a source needs to be found first.

## Phase 4: Fill In

Work through the outline section by section. A section that is hard to write means the mental model is still weak there: return to Phase 2 for that sub-topic, not the whole article. The most common stall signal is an opening sentence rewritten three times without settling. The outline may change, and that is fine.

## Phase 5: Refine

Edits only: cut redundancy without changing meaning or voice, flag broken argument flow, and mark gaps (concepts used before they are explained, claims needing sources). Do not draft new sections from scratch. Then strip AI patterns: invoke `/write` when installed, otherwise scan manually for filler, binary contrasts, and dramatic fragmentation.

## Phase 6: Self-review and Publish Readiness

The user reads the entire article linearly before publishing. Mark everything that feels off, fix it, read again. Two passes minimum.

Before that handoff, gate the draft on the five research anti-patterns (check and signal per item live in `references/research-techniques.md` — Research Anti-Patterns; the gate applies to every research task, loaded or not). A conclusion that fails a check gets rewritten or explicitly hedged with its confidence label, not published as stated. Record the gate output in this shape, one line per check:

```
anti-pattern gate:
- Simpson's paradox: pass | N-A (no aggregated quantitative claims) | fail → quoted per-segment rates instead
- Survivorship bias: pass | N-A (why) | fail → action taken
- Vanity metrics: pass | N-A (why) | fail → action taken
- Goodhart's law: pass | N-A (why) | fail → action taken
- Base-rate neglect: pass | N-A (why) | fail → action taken
```

When it reads clean from start to finish, the draft is ready for the user to publish.

## Common Rationalizations

- "I already know the topic, I can skip Phase 1" — Phase 1 discovers what you don't know you're missing; skipping it produces confirmation-biased output.
- "Summarizing each source is the same as digesting" — summarizing preserves the source's framing; digesting builds your mental model that can predict new problems.
- "Generic wisdom is still worth including" — if any expert would say the same thing, it's not specific enough to earn space in the outline.

## Red Flags

- Starting Phase 4 on an outline section that has no Phase 1 source behind it
- Silently picking one side when two sources contradict on a factual claim
- Padding the outline with generic wisdom any expert in the field would say
- Fetching with native tools or `curl` while `/read` is installed
- Pasting raw conversation history into the final artifact instead of distilled notes

## Verification

1. Outline review: every section maps to at least one Phase 1 source.
2. Contradiction check: all factual disagreements between sources are noted with both positions and evidence.
3. Phase 6 self-review: user reads the entire article linearly, two passes minimum, marking everything that feels off.
4. Publish readiness: no AI-pattern artifacts remain after Phase 5 refinement.

## Hard Rules

- **Contradictions stay visible.** When two sources contradict on a factual claim, note both positions and the evidence each gives; never silently pick one.
- **Stop at publish confirmation.** After the user confirms the article is ready, do not upload, post, distribute, or perform any publish action unless explicitly asked.

## Output

The artifact is the mode's exit from the table above. Report the saved path when files were written and complete the authorized handoff; publication requires an explicit request as stated in Hard Rules.
