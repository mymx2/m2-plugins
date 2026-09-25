<!-- Derived from vercel-labs/writing-guidelines (MIT): https://github.com/vercel-labs/writing-guidelines -->

# Writing Review

Findings without line numbers are opinions. Every finding must be clickable: `file:line`, terse, no preamble.

Review scope: the files or patterns the user named in the request; if none are named, ask for the scope first. Read and report only: do not edit the reviewed files unless the user asks for fixes.

## Outcome Contract

- **Outcome**: A findings list grouped by file, every item in `file:line` form; files with no findings listed as `✓ pass`.
- **Done when**: Each finding points at a concrete line.

## Rules

Read the files in scope, then check every rule group below in order. Checklist lines distill the writing-guidelines reference owned by the write skill, which is the single source for rule wording and rationale. If a checklist line disagrees with the rulebook, follow the rulebook and report the drift to the skill maintainer.

### Planning & content type

- Every page has a plan (overview, goal, audiences, documentation plan, open questions) referenced or linked
- Content type declared in `meta.contentType` (`Tutorial`, `How-to`, `Reference`, `Conceptual`, `Troubleshooting`, or `Landing`), and the page does that one job, not three at once
- Title is user-shaped (the user's question), not feature-shaped (the engineer's name); goal is verb-driven ("configure", "explain", "debug")
- Multi-audience pages: short shared opener, then technical subsections

### Voice & tone

- Active voice. Mental test: append "by monkeys". If the sentence parses, rewrite
- Direct address: `you`, never `the user` or `one can`; `we` only for deliberate Vercel actions ("we recommend"), never as a stand-in for `you`
- Imperative for steps: "Click **Add Project**", not "You will need to click **Add Project**"
- Sentences under 20 words target; present tense unless describing future behavior
- No rhetorical questions
- Second-read test: read each sentence once at speech pace; if you re-read to parse it, flag it

### Banned words

- `easy`, `simple`, `quick` → concrete description ("one command", "default settings"); `very`, `just`, `really`, `simply` → cut

### Concision

- Earn every detail: cut details a more general phrasing would not change
- Weasel words (`significantly`, `many`, `often`, `typically`) and vague quantifiers (`near-zero`, `sub-second`) → specific number or cited figure; filler/metaphor verbs (`lands`, `carries`, `hits`) → literal step

### AI-generated tells

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

- Sentence case for page headings (`H1` through `H6`); title case for nav labels; `meta.title` becomes the `H1`, `meta.navLabel` the sidebar entry
- Subheadings descriptive, not cute: "Caveats when self-hosting on Cloudflare", not "Caveats"

### Structure

- Every page opens with a one-paragraph TL;DR; every major section opens with a summary sentence
- Acronyms spelled out on first use: "Content Security Policy (CSP) blocks inline scripts"
- Reference docs organized by surface, education docs by reader task; paragraphs 2 to 4 sentences, split anything longer or covering two ideas

### Lists

- Three or more list-shaped items in a paragraph: convert to a list (bulleted for unordered, numbered for ordered)
- Always introduce a list with a colon; no periods at the end of items unless full sentences
- Bold/description format: `- **Term**: description here` (colon after bold term)

### Code

- Code blocks need a language tag; TypeScript is the default unless the surface is genuinely language-agnostic
- Multi-step flows wrapped in `<Steps/>`
- Highlight load-bearing lines: ` ```typescript {8-12,23-37} `
- ≤80 columns and ≤25 lines per snippet; split longer blocks with prose
- Omit defaults; don't repeat variable definitions; minimal comments, prefer prose explanation
- Explain what every code block does in prose (don't drop and run)
- Don't reference full example files at the end of guides ("See `train.py`"); the guide is the deliverable
- Latest model strings only in examples; check what the project already uses and flag anything superseded

### Placeholders

- Text placeholders: `snake_case`, descriptive: `your_access_token_here`; number placeholders count up: `1234567890123`
- Never `<TOKEN>`, `xxx`, `your-token`, or generic ALL_CAPS

### Data sizes & units

- Space + uppercase unit: `64 KB`, `5 KB`, `200 ms`; exception: seconds is bare: `30s`
- Numerals for counts: `8 deployments`, not `eight`

### Money & pricing pages

- Uncompromising detail: err on "too much"
- Use tables for pricing; never assume reader knows the pricing model or invocation counting

### Emphasis

- **Bold** means UI element or critical fact, never emphasis-for-emphasis-sake
- `Inline code` for paths, file extensions, identifiers, short snippets (`/api`, `.tsx`, `body`, `query`, `req`): if it would look weird without a monospace font, monospace it

### Punctuation & typography

- Never em dashes (`—`) or dashes (`-`) as punctuation; use colons, commas, periods, or rephrase
- Curly quotes `"` `"` and `'` `'`, not straight `"` or `'`; ellipsis `…`, not three dots `...`
- Non-breaking spaces in `10&nbsp;MB`, `⌘&nbsp;K`, brand names; `&` over "and" only where space-constrained (nav labels, buttons)

### Source formatting

- Don't hard-wrap paragraphs: each paragraph is one line in source, let the editor wrap
- One blank line before headings and around code blocks; no `---` horizontal rules between sections

### Links

- Every term defined and linked to its conceptual page on first use; anchor text names the destination, never bare URLs or `here`/`link`

### Quality checklist (required boxes are non-negotiable)

Items referencing Vercel-specific surfaces (the ACME demo account, `vercel/examples`, dashboard deep links) apply only to Vercel-docs-like projects; skip them elsewhere.

- **Findability**: sidebar bucket set via `meta.category`; UI links to docs from any dashboard surface that exposes the feature
- **Accuracy**: code samples actually run; screenshots map 1:1 to current UI and use the ACME demo account
- **Clarity**: overview addresses who/what/where/why; quickstart for new products; prerequisites listed on tutorials; sample repo in `vercel/examples` for multi-step tutorials; visual aids in confusing sections; simplest path recommended when multiple exist
- **Completeness**: limits documented; all-limits tables updated
- **Readability**: nav names scannable and use action verbs

### Document-level checks (PDFs, white papers, review reports)

- **Privacy scan**: detect PII. Hard stop on any text implying job seeking, competitor info, or personal data leakage; append `privacy: clear / N issues found` to the output
- **Durable-doc scan**: in review reports, scorecards, or diagnostic snapshots, flag dated claims, stale line references, private paths, repo-specific commands, and current-score framing; recommend extracting stable rules instead
- **Bilingual validation**: for CN/EN pairs, confirm translation accuracy and terminology consistency (the `write` skill owns the bilingual prose rules)
- **Rendering check**: placeholder text remaining (`Lorem ipsum`, `TODO`, `[TBD]`), broken image links

## Output Format

```text
## content/docs/sandbox.mdx

content/docs/sandbox.mdx:1 - missing meta.contentType
content/docs/sandbox.mdx:12 - title "Vercel Sandbox" is feature-shaped, not user-question
content/docs/sandbox.mdx:24 - passive voice ("the sandbox is created...")
content/docs/sandbox.mdx:31 - banned word "easy"
content/docs/sandbox.mdx:47 - "..." → "…"
content/docs/sandbox.mdx:58 - code block missing language tag
content/docs/sandbox.mdx:118 - em dash in prose, replace with colon/comma
content/docs/sandbox.mdx:121-124 - hard-wrapped paragraph

## content/docs/cron.mdx

✓ pass
```
