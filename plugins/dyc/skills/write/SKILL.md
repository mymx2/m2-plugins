---
name: write
description: 'Rewrites and polishes prose in Chinese or English, removes AI-like wording, and authors technical documentation with the writing rulebook. Use when users ask to rewrite or polish prose, remove AI-like wording, draft release notes or social copy, localize copy, write documentation, or draft or revise coding standards. Not for code comments, commit messages, or rulebook audits (use check).'
when_to_use: '帮我写, 改稿, 润色, 去AI味, 写一段, 本地化文案, 多语言文案, i18n copy, localization copy, 推特, twitter, X推文, tweet, social post, 连贯性, 段落连贯, draft, proofread, sound natural, polish, rewrite, write docs, 技术文档, 写作规范, 规约, 编码规范, 规范文件, coding standard, documentation style, 文档写作'
---

# Write: Cut the AI Taste

Strip AI patterns from prose and rewrite it to sound human. Do not improve vocabulary; remove the performance of improvement.

## Overview

The skill is a catalog of smells, not a checklist: recognize AI taste, make judgment calls, preserve the author's voice.

## Outcome Contract

- Outcome: the prose preserves the author's intent while sounding natural for its audience and surface.
- Done when: meaning, factual claims, and structure are preserved unless the user asked to change them, and AI-like wording is removed; punctuation and CJK/Latin mixing pass the Punctuation Gate for the output language.
- Evidence: supplied text, target audience, project style references, release or product state, and requested language.
- Output: edited prose for pasted text; for repository edits, a scoped diff and the requested verification or delivery receipt.
- Authorization: prose editing only. No code changes, no commit/push, no publishing without current-turn approval.

## When to Use

- Rewriting or polishing prose in Chinese or English.
- Removing AI-like wording from drafts.
- Authoring technical documentation with the writing rulebook.
- Drafting or revising coding standards, spec clauses, or team conventions.
- Drafting release notes, social posts, maintainer replies, or long-form articles.
- Route to `check` for auditing docs against the rulebook; route to `learn` for multi-source research before writing.

## Core Stance

核心立场见 `references/write-zh.md`（例子库，不是检查清单；过度改和改不到位一样糟）。

- **A piece has a speaker.** Smooth prose that could belong to anyone has lost something. Keep the author's colloquial words, cadence, knowledge and judgments; deliberate authorial or genre choices take precedence over these defaults. The author's affection, frustration, pride, gratitude and personal convictions are content, even when abstract or phrased as a conclusion. Preserve their intensity; do not require external evidence for a feeling or replace it with a neutral observation. Read nearby paragraphs and author revisions to separate a real stance from stock rhetoric. If that distinction is uncertain, keep the sentence. Do not invent emotion or turn "what I did" into "what you must do."
- **Banned-phrase lists and replacement tables are examples, not find-and-replace.** A flagged word that reads naturally in context stays. Match the smell, not the string. When source material exists, check it before flagging the author's wording; restore their words rather than paraphrasing them. When restoring copy, trace that passage's diffs to the nearest version before the unwanted edit and compare the restored text exactly; do not choose an older, shorter version or rewrite unrelated paragraphs.

## Pre-flight

1. **Locate the text.** Read named files or discover posts in the supplied repository before asking the user to paste anything. For "latest N," freeze the dated article set and its language mirrors, then account for each as edited, unchanged with reason, or unavailable.
2. **Audience locked?** If the intended audience is unclear and cannot be inferred from the text (blog reader vs RFC vs email), ask before editing. Junior engineer and senior architect prose should read completely different.
3. **Language detected from the text being edited**, not the user's command:
   - Contains Chinese characters → load `references/write-zh.md` plus `references/write-zh-ai-detection.md`, `references/write-zh-structure.md` and `references/write-zh-voice.md`
   - Bilingual or translation review → load `references/write-zh-bilingual.md` and the language references for both versions
   - Otherwise → load `references/write-en.md`

## Mode Picker

Default is a line-level rewrite of the supplied text. Take a mode only when its row matches, and load a mode file only when its row points at one. The mode sections below own the judgment half only; trigger keywords live in this table.

| Ask                                                                                                | Mode                                                             |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Release note, changelog entry, update-feed copy                                                    | load `references/mode-release-notes.md`                          |
| Maintainer reply on a public issue or PR                                                           | load `references/mode-public-reply.md`                           |
| Long draft needing structural work                                                                 | load `references/mode-long-form.md`                              |
| Mixed Chinese/English, EN/CN pair drift, "bilingual consistency", "Chinese copywriting"            | [Bilingual Review](#bilingual-review-mode)                       |
| Product, site, or app copy across locales; "本地化文案", "多语言文案", "i18n copy"                 | [Product Localization Review](#product-localization-review-mode) |
| Document, PDF, or white paper to review ("审稿", "check this document")                            | route to the `check` skill (it owns document audits)             |
| Write or revise technical documentation (tutorial, how-to, reference, conceptual, troubleshooting) | load `references/writing-guidelines.md`                          |
| Repo-level docs (README, changelogs, inline comments, API docs, ADRs)                              | load `references/documentation.md`                               |
| Coding standard, spec clauses, team convention (规约/规范/标准)                                    | load `references/writing-standards.md`                           |
| Paragraphs that read disconnected ("连贯性", "段落连贯", "coherence", "flow check")                | [Paragraph Coherence](#paragraph-coherence-mode)                 |
| Tweet, thread, or launch post ("推特", "X推文", "social post", "发文")                             | [Tweet / Social Post](#tweet--social-post-mode)                  |

`writing-guidelines.md` covers the prose of a single document; `documentation.md` covers repo-level structure and conventions (README shape, changelog curation, comment discipline, agent-facing docs).

## Durable Context Preflight

When the user names memory, a prior decision, or a memory path, apply the project's durable-context rules (`rules/durable-context.md` when present): current state wins over memory, memory alone never authorizes state changes, and the redaction gate applies before any of it becomes a durable rule. For `/write`: the supplied text and current release state override memory.

## Common Rationalizations

- "I can draft without reading the source material" — artifact-grounded claims require reading the changelog, product page, or screenshot before writing.

## Red Flags

- Appending a change list, justification, or closer the user did not ask for
- Inventing anecdotes, examples, or quotes the supplied material does not contain
- Reordering paragraphs or merging sections without an explicit structural request
- Returning output longer than the first draft when the ask was polish

## Verification

1. Run the Punctuation Gate script on the output before returning.
2. Sweep the whole text for any flagged smell class (not just the one instance the user noticed).
3. Confirm the output is shorter than or equal to the first draft, not longer.
4. If factual claims were made, verify them against real source material (changelog, product page, screenshot).

## Hard Rules

- **No silent restructuring.** Do not reorganize headings, reorder paragraphs, or merge sections unless structural changes are explicitly requested. Edit in place. Structural assets are not cleanup noise: image placeholders, links, frontmatter, and example blocks stay unless the user asked to remove them, and any deletion gets listed with its reason instead of discovered later in the diff. (Exception: `references/mode-long-form.md` treats structural cuts and merges as in-scope, since structure is the main problem there; it still proposes them as change-points first instead of doing them silently.)
- **No invented first-person experience.** When ghostwriting as the author, every personal anecdote, tool history, opinion, and quote must come from the supplied material or the author's published writing. The material lacking an example is a question to ask, not a gap to fill. Before drafting in the author's voice (rather than editing supplied text), read one or two of their published pieces as the voice and length baseline.
- **Material gate before drafting long-form.** When asked to write rather than edit, count what you actually hold before choosing a length: supplied experience, numbers, quotes, actions, and verifiable public sources. A category name is not a material, and a restated idea is not a second material. Reasoning connects material; it does not breed material. If you cannot name a distinct material for each planned section, the plan is longer than the evidence. Resolve it by researching first, asking at most three questions in one round, or shipping a shorter piece. A target word count is not a reason to pad with invented examples or a fourth phrasing of the same point.
- **Artifact-grounded claims.** For launch copy, release notes, social posts, product pages, and public replies, ground factual claims in real source material: current app behavior, runnable artifact, screenshot, product page, release page, changelog, issue/PR, or user-provided draft. Do not present handoffs, plans, old memory, or stale screenshots as current product truth, and do not turn concrete product evidence into generic marketing language.
- **No em-dash.** Never produce em-dash (U+2014) or en-dash (U+2013) in Chinese or English output; use commas, periods, colons, semicolons, or parentheses to break clauses.
- **Match the requested handoff.** No summary, no commentary, no explanation of changes unless explicitly asked. Pasted-text rewrites need no explanation. Repository edits need the scoped diff and verification; complete explicitly authorized commit/push steps under the project's rules. A prose-only output convention must not hide unfinished delivery.

## Punctuation Gate

Before returning any produced text (a rewrite, or generated release / reply / social copy), run the checker from the installed skill base directory:

```bash
GATE="<skill-base-dir>/scripts/check-punctuation.sh"
[ -f "$GATE" ] || { echo "punctuation gate not found under the installed skill base; reinstall the write skill" >&2; exit 1; }
bash "$GATE" --lang <zh|en|ja|auto> <file>   # or pipe text via stdin
```

Replace `<skill-base-dir>` with the installed write skill's base directory (or the repo root's `skills/write` in a source checkout). The `.sh` is the entry wrapper; the rule engine lives in `scripts/check_punctuation.py`.

It enforces character-level punctuation by locale (half/full-width marks, CJK/Latin spacing, em/en dashes) and skips code, inline code, URLs, and markdown link targets, so it never fires on code; the script header documents the exact rule set. Fix every finding while preserving meaning; `--fix` rewrites only the zero-ambiguity zh cases to stdout. `--lang auto` classifies the whole input by fixed priority: any kana routes to ja, else any CJK to zh, else any Hangul to ko (reserved, skipped), else en, so a mostly-Chinese text that merely quotes a Korean glyph still routes to zh; pass an explicit `--lang` for mixed-locale or predominantly-English text. The checker owns character-level punctuation only; quote direction and other judgment calls stay with you and the reference files.

## Bilingual Review Mode

Load `references/write-zh-bilingual.md`. Character-level spacing and punctuation belong to the Punctuation Gate script; this mode owns the judgment half: terminology consistency across all instances, unexplained English left untranslated in Chinese documents, and EN/CN pairs that drift in meaning (mark translation loss instead of silently rewriting one side).

## Product Localization Review Mode

Load `references/write-product-localization.md`. If Chinese is one of the locales, also load `references/write-zh-bilingual.md`.

## Paragraph Coherence Mode

For review requests, report issues; for explicit rewrite or file-edit requests, apply the minimal authorized fixes. Check each paragraph for:

1. Flag transitions that abruptly shift topic without a signal.
2. Flag paragraphs where the opening sentence does not follow from the previous paragraph's close.
3. Flag rhythm issues: monotone sentence length (all short or all long across a whole paragraph).
4. Suggest the minimal fix for each: one word, one reordered clause, one bridging sentence.

Output: for review, a numbered list with paragraph locations and minimal fix suggestions; for rewriting, the revised text or scoped file changes. Do not ask again to apply already-authorized edits.

## Tweet / Social Post Mode

Apply the 推文五规则 in `references/write-zh-release-notes.md` (community lead, 2-4 highlights, UX framing, one stance, native rhythm) plus its closing convention (end with an invitation, not a CTA) for product-engineer projects when the project context or prior artifact shows this style. For other engineering projects or English posts, apply the same structure adapted to the project's voice.

## Gotchas

| What happened                                                | Rule                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Used formal register for a blog draft                        | Match the target audience's register. Blog is conversational, not academic.            |
| Applied Chinese/English spacing rules to a pure-English text | Bilingual spacing rules (半角/全角) only apply when the text mixes Chinese and English |

## Output

Follow the Outcome Contract. For batch edits, reconcile the original article set and mirrors before reporting completion. State missing source or verification without treating it as a pass.
