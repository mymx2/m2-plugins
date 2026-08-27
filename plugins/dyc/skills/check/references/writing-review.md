<!-- Derived from vercel-labs/writing-guidelines (MIT): https://github.com/vercel-labs/writing-guidelines -->

# Writing Review

Findings without line numbers are opinions. Every finding must be clickable: `file:line`, terse, no preamble.

Review scope: the files or patterns the user named in the request. If none are named, ask for the scope first.

Read files, check against rules below. Output concise but comprehensive: sacrifice grammar for brevity. High signal-to-noise.

## Outcome Contract

- **Outcome**: A findings list grouped by file, every item in `file:line` form.
- **Done when**: Each finding points at a concrete line; files with no findings are listed as `✓ pass`.
- **Evidence**: The quoted line content behind each finding.
- **Authorization**: Read and report only — do not edit the reviewed files unless the user asks for fixes.

## Review Process

1. Read the files in the review scope; if the user named none, ask for the file scope first.
2. Check against each rule group below, in order.
3. Output findings in the Output Format: state issue + location, skip explanation unless the fix is non-obvious.

## Rules

The rule groups below are the checklist — apply every group to every file. Checklist lines distill the writing rulebook owned by the write skill (its writing-guidelines reference), which is the single source for rule wording and rationale; when the rulebook changes, update the matching checklist line here. A few lines are checklist-side extensions with no rulebook counterpart — the second-read test, the multi-audience opener, the doc-organization and paragraph-length lines, the `AGENTS.md` instruction, the `Intl.*` date/number format line, and the Quality checklist section; these are maintained directly in this file.

### Planning & content type

- Every page has a plan (overview, goal, audiences, documentation plan, open questions) referenced or linked
- Content type declared in `meta.contentType`: `Tutorial`, `How-to`, `Reference`, `Conceptual`, `Troubleshooting`, or `Landing`
- Title is user-shaped (the user's question), not feature-shaped (the engineer's name)
- Page does one job: tutorial OR how-to OR reference, not three at once
- Goal is verb-driven (Bloom's taxonomy): "configure", "explain", "debug" (testable)
- Multi-audience pages: short shared opener, then technical subsections

### Voice & tone

- Active voice. Mental test: append "by monkeys". If the sentence parses, rewrite
- Direct address: `you`, never `the user` or `one can`
- Imperative for steps: "Click **Add Project**", not "You will need to click **Add Project**"
- Sentences under 20 words target
- Contractions encouraged (`you'll`, `it's`) for warmth
- Present tense unless describing future behavior
- Limit `we`: only for deliberate Vercel actions ("we recommend", "we deprecated"), never as a stand-in for "you"
- No rhetorical questions (sounds like marketing)
- Second-read test: read each sentence once at speech pace; if you re-read to parse it, name the subject, the action, and the consequence (kill metaphor verbs and pronouns reaching back several sentences)

### Banned words

- `easy`, `simple`, `quick`: puts pressure on the reader and reads as marketing; replace with concrete description ("one command", "default settings", "most projects don't need this")
- `very`, `just`, `really`, `simply`: filler; cut or rewrite

### Concision

- Earn every detail: cut details a more general phrasing would not change
- Weasel words (`significantly`, `many`, `often`, `typically`, `generally`) → specific number or claim
- Vague quantifiers (`near-zero`, `sub-second`, `most requests`) → cited figure
- Filler/metaphor verbs (`moves through`, `lands`, `carries`, `hits`) → literal step

### AI-generated tells (flag these)

- Summary-style transitions recapping the previous paragraph (`With this setup complete…`)
- Stop-start fragments splitting one dependent idea into choppy sentences
- Spec-sheet voice reading like a datasheet (`provides`, `is configurable`, `is explicitly labeled`)
- Cold-open body paragraphs whose first sentence has no antecedent
- Personified artifacts performing human-physical actions (`hand the browser a URL`)
- Reused/template framing not specific to the page (`The question most teams face is whether…`)

### Tone, by content type

- **Tutorial**: warm, encouraging, predictable structure, no traps
- **How-to**: terse, direct (reader is mid-task)
- **Reference**: neutral, exhaustive, quotable
- **Conceptual**: explain like the reader will teach it back; examples and analogies welcome
- **Troubleshooting**: empathetic but not apologetic; acknowledge then fix

### Headings

- Sentence case for page headings (`H1` through `H6`): "Configure environment variables", not "Configure Environment Variables"
- Title case for nav labels: "Configuring Environment Variables"
- `meta.title` becomes the `H1`; `meta.navLabel` becomes the sidebar entry
- Subheadings descriptive, not cute: "Caveats when self-hosting on Cloudflare", not "Caveats"
- Reader should be able to guess section content from the heading alone

### Structure

- Every page opens with a one-paragraph TL;DR of what the page covers
- Every major section opens with a summary sentence
- Acronyms spelled out on first use: "Content Security Policy (CSP) blocks inline scripts"
- Define every term the first time you use it (link to its conceptual page)
- Reference docs organized by surface; education docs organized by reader task
- Keep paragraphs to 2 to 4 sentences; split anything longer or covering two ideas

### Lists

- Three or more list-shaped items in a paragraph: convert to a list
- Bulleted for unordered; numbered for ordered (lifecycles, sequential steps)
- Always introduce a list with a colon
- No periods at the end of list items unless they are full sentences
- Bold/description format: `- **Term**: description here` (colon after bold term)

### Code

- Code blocks need a language tag for syntax highlighting
- TypeScript is the default for new code unless the surface is genuinely language-agnostic
- Multi-step flows wrapped in `<Steps/>` so structure is visible
- Highlight load-bearing lines: ` ```typescript {8-12,23-37} `
- ≤80 columns per line in snippets
- ≤25 lines per snippet; split longer blocks with prose
- Omit defaults; don't repeat variable definitions, use shared var
- Minimal comments in code blocks; prefer prose explanation
- Explain what every code block does in prose (don't drop and run)
- Don't reference full example files at the end of guides ("See `train.py`"); the guide is the deliverable

### Placeholders

- Text placeholders: `snake_case`, descriptive: `your_access_token_here` (so reader can double-click to select before pasting)
- Number placeholders: count up `1234567890123` (recognizable as fake, predictable)
- Never `<TOKEN>`, `xxx`, `your-token`, or generic ALL_CAPS

### Data sizes & units

- Space + uppercase unit: `64 KB`, `5 KB`, `200 ms`
- Exception: seconds is bare: `30s`
- Numerals for counts: `8 deployments`, not `eight`
- Consistent across the corpus so readers can develop scanning habits

### Money & pricing pages

- Uncompromising detail: err on "too much"
- Use tables for pricing
- Never assume reader knows the pricing model or whether their workload counts as one invocation or several
- Clarity and transparency above all else

### Emphasis

- **Bold** means UI element or critical fact, never emphasis-for-emphasis-sake
- Reaching for bold for tone: the sentence is weak; rewrite it
- `Inline code` for paths, file extensions, identifiers, short snippets: `/api`, `.tsx`, `body`, `query`, `req`
- Rule: if it would look weird without a monospace font, monospace it

### Punctuation & typography

- Never em dashes (`—`) or dashes (`-`) as punctuation; use colons, commas, periods, or rephrase
- Curly quotes `"` `"` and `'` `'`, not straight `"` or `'`
- Ellipsis `…`, not three dots `...`
- Loading states end with `…`: `Loading…`, `Saving…`
- Non-breaking spaces in `10&nbsp;MB`, `⌘&nbsp;K`, brand names
- `&` over "and" only where space-constrained (nav labels, buttons)

### Source formatting

- Don't hard-wrap paragraphs: each paragraph is one line in source, let the editor wrap
- One blank line before headings; one blank line before and after code blocks
- No `---` horizontal rules between sections
- No extra blank lines between elements that aren't paragraph breaks

### Links

- Every term defined and linked to its conceptual page on first use
- Anchor text names the destination; never bare URLs or `here`/`link`
- Dashboard deep links use the standard format; canonical product docs and the model catalog linked where relevant

### Models in examples

- Latest model strings only; outdated strings in examples are findings. Check what the project already uses and flag anything superseded.

### AI workflow

- You are accountable for the content you produce, however it is created
- You are the final arbiter; the model proposes, you dispose
- Hold technical accuracy to a high standard: docs are also consumed by LLMs, wrong docs train wrong models
- Use only enterprise models that do not train on your data (especially for unreleased products)
- Disclose AI use in the PR (model + prompts if useful)
- Plan first by hand; the plan is the spec the model works against
- Use plan-mode in your editor (Cursor, Claude) before letting the model write
- Tell the model to follow `AGENTS.md` and the linting checklist
- Run a test prompt against the preview: "given this plan's goal, can the model complete the task using only this page?"
- Final human review always

### Quality checklist (required boxes are non-negotiable)

Items referencing Vercel-specific surfaces (the ACME demo account, `vercel/examples`, dashboard deep links) apply only to Vercel-docs-like projects; skip them elsewhere.

- **Findability**: sidebar bucket set via `meta.category`; UI links to docs from any dashboard surface that exposes the feature
- **Accuracy**: code samples actually run; screenshots map 1:1 to current UI and use the ACME demo account
- **Relevance**: code samples included where applicable (TypeScript first; `<Steps/>` for multi-step flows)
- **Clarity**: overview addresses who/what/where/why; high-level use cases laid out; quickstart for new products; prerequisites listed on tutorials; sample repo in `vercel/examples` for multi-step tutorials; steps detailed not vague; visual aids in confusing sections; simplest path recommended when multiple exist
- **Completeness**: limits documented; all-limits tables updated; documentation plan followed and goals addressed
- **Readability**: nav names scannable and use action verbs; content types accurately used; subheadings descriptive; topics start with summaries; code blocks formatted correctly; active voice where warranted

### Review

- PR description links to the content plan, lists what to review, and links the preview URL
- Ping the team via the PR link (not the plan or preview directly)
- Author is accountable, not the reviewer; reviewers are liberal with approvals
- Suggestion comments for small text fixes; preview comments for anything bigger
- Disagreement is fine; reject with a one-line reason and move on

### Document-level checks (PDFs, white papers, review reports)

- **Privacy scan**: detect PII (names, companies, employment dates, salary hints, location details). Hard stop if any text implies job seeking, competitor info, or personal data leakage; append `privacy: clear / N issues found` to the output
- **Durable-doc scan**: if the document is a review report, scorecard, or diagnostic snapshot, flag dated claims, stale line references, private paths, repo-specific commands, and current-score framing. Recommend extracting stable rules instead of preserving the snapshot as evergreen guidance
- **Bilingual validation**: for CN/EN pairs, confirm translation accuracy and terminology consistency (the `write` skill owns the bilingual prose rules)
- **Rendering check**: placeholder text remaining (`Lorem ipsum`, `TODO`, `[TBD]`), broken image links

## Output Format

Group by file. Use `file:line` format (VS Code clickable). Terse findings.

```text
## content/docs/sandbox.mdx

content/docs/sandbox.mdx:1 - missing meta.contentType
content/docs/sandbox.mdx:12 - title "Vercel Sandbox" is feature-shaped, not user-question
content/docs/sandbox.mdx:24 - passive voice ("the sandbox is created...")
content/docs/sandbox.mdx:31 - banned word "easy"
content/docs/sandbox.mdx:47 - "..." → "…"
content/docs/sandbox.mdx:58 - code block missing language tag
content/docs/sandbox.mdx:71 - placeholder <TOKEN> → your_access_token_here
content/docs/sandbox.mdx:89 - "64KB" → "64 KB"
content/docs/sandbox.mdx:102 - H2 "Caveats" too generic; add specificity
content/docs/sandbox.mdx:118 - em dash in prose, replace with colon/comma

## content/docs/ai-gateway.mdx

content/docs/ai-gateway.mdx:5 - title case in H1; sentence case only
content/docs/ai-gateway.mdx:18 - acronym AI Gateway used before being spelled out
content/docs/ai-gateway.mdx:34 - bold for emphasis, not UI element
content/docs/ai-gateway.mdx:52 - `anthropic/claude-sonnet-4` outdated; use `anthropic/claude-opus-4-7`
content/docs/ai-gateway.mdx:71 - hard-wrapped paragraph (lines 71-74)

## content/docs/cron.mdx

✓ pass
```

State issue + location. Skip explanation unless fix is non-obvious. No preamble.
