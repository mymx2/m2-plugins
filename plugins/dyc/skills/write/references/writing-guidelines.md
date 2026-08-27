<!-- Derived from vercel-labs/writing-guidelines (MIT): https://github.com/vercel-labs/writing-guidelines -->

# Writing Guidelines

Docs succeed because of hundreds of small decisions. This is a living, non-exhaustive list of those decisions, drawn from the Vercel docs handbook and the patterns that hold up across hundreds of pages. Most guidelines are framework-agnostic, with a few Vercel-specific conventions called out inline.

This file is the single source for rule wording and rationale. The check skill's writing-review reference carries the review checklist that applies these rules; when a rule changes here, update the matching checklist line there.

## Outcome Contract

- **Outcome**: A technical doc draft or revision that complies with the rules below.
- **Done when**: Content type declared; banned words eliminated; every code block has a language tag; headings are sentence case.
- **Evidence**: Section-by-section self-check against this file; no rule skipped silently.
- **Output**: The revised doc, plus a short list of rules consciously not applied and why.
- **Authorization**: Edit documentation only — do not touch code, config, or product copy outside the doc surface.

## How to Apply

1. Pick the content type first (`Tutorial`, `How-to`, `Reference`, `Conceptual`, `Troubleshooting`, `Landing`) — it drives the shape.
2. Draft the five-section plan (overview, goal, audiences, documentation plan, open questions) before writing prose.
3. Write applying Voice & tone and Structure rules as you go.
4. Finish with a typography and source-formatting pass (quotes, ellipsis, units, wrapping).
5. If an LLM drafted any part, follow the AI workflow section: disclose, and do a final human review.

## Planning

- **Plan before you write.** Every page starts with a five-section plan: overview, goal, audiences, documentation plan, and open questions. The plan becomes the LLM prompt, the test spec, and the PR description. One artifact does multiple jobs.
- **Pick a content type early.** Declare it in `meta.contentType`: `Tutorial`, `How-to`, `Reference`, `Conceptual`, `Troubleshooting`, or `Landing`. The type drives the shape; one page does one job.
- **Title around the user's question.** A page called "Vercel MCP Server" is the engineer's name for the thing. A page called "Make your SaaS work in ChatGPT" is the user's question. Same content, different title and search surface.
- **Goals are testable.** Use a verb from [Bloom's taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy) (`configure`, `explain`, `debug`). You should be able to hand the goal to an LLM and ask whether the page enables it.
- **Define every term on first use.** Link "edge function" to its conceptual page the first time it appears. The cost of the link is zero; the cost of a reader who bounces on unfamiliar jargon is the whole page.

## Voice & tone

- **Active voice.** Mental test: append "by monkeys". If "the page will be updated by monkeys" parses, rewrite to "Vercel updates the page".
- **Direct address.** Use `you` when the reader is acting. Never `the user` or `one can`.
- **Imperative for steps.** "Click **Add Project**", not "You will need to click **Add Project**". The imperative is shorter, more honest, and consistent with how a CLI or API documents itself.
- **Short sentences.** Target under 20 words.
- **Contractions encouraged.** `you'll`, `it's`. They reduce stiffness.
- **Present tense** unless describing future behavior.
- **Limit `we`.** Only for deliberate Vercel actions ("we recommend", "we deprecated"). Never as a stand-in for `you`.
- **Banned words: `easy`, `simple`, `quick`.** They sound friendly but pressure the reader. Replace with a concrete description: "one command", "default settings", "most projects don't need this".
- **Cut filler words.** `very`, `just`, `really`, `simply`.
- **No rhetorical questions.** They sound like marketing.

## Concision

- **Earn every detail.** Cut a number, name, or implementation detail if a more general phrasing would not change the reader's understanding or action.
- **No weasel words.** Replace vague qualifiers (`significantly`, `many`, `often`, `typically`, `generally`) with a specific number or claim.
- **No vague quantifiers.** Not `near-zero`, `sub-second`, `most requests`; give the figure and cite it (`99.37% of requests see zero cold starts`).
- **Name the action.** Filler and metaphor verbs (`moves through`, `lands`, `carries`, `hits`) reach for cadence; write the literal step.

## AI-generated tells

Strip these patterns from drafts, yours or a model's:

- **Summary-style transitions.** Never open a paragraph by recapping the last one (`With this setup complete…`, `Now that we've explored…`); pivot straight to the next point (`In practice…`, `The catch is…`).
- **Stop-start sentences.** Do not split one dependent idea into choppy fragments (`Previously this was manual. Now it's automatic. This saves time.` becomes one sentence); short sentences for emphasis are fine.
- **Spec-sheet voice.** Rewrite sentences that read like a system reading a datasheet (`provides`, `is configurable`, `is explicitly labeled`).
- **Cold-open paragraphs.** A body paragraph whose first sentence works as a standalone heading has no antecedent; carry the prior subject forward (`Because…`, `Once…`).
- **Personified artifacts.** Machines do not perform human-physical actions (`hand the browser a URL` → `the browser fetches the URL`; `the token holds…` → `the token is stored…`).
- **Reused framing.** The angle must come from this page, not a template (`The question most teams face is whether…`).

## Tone, by content type

- **Tutorial.** Warm, encouraging, predictable structure, no traps. You're walking a new colleague through their first deploy.
- **How-to.** Terse, direct. The reader is mid-task. Get them out.
- **Reference.** Neutral, exhaustive, quotable. The reader will quote you in an issue.
- **Conceptual.** Explain like the reader will teach this back to someone tomorrow. Examples and analogies are welcome here in a way they are not in a how-to.
- **Troubleshooting.** Empathetic but not apologetic. Acknowledge the error, then get to the fix.

## Headings & structure

- **Sentence case for page headings** (`H1` through `H6`). "Configure environment variables", not "Configure Environment Variables".
- **Title case for nav labels.** "Configuring Environment Variables". The page H1 is a sentence; the nav is a label.
- **`meta.title` becomes the H1; `meta.navLabel` becomes the sidebar entry.**
- **Subheadings descriptive, not cute.** "Caveats when self-hosting on Cloudflare", not "Caveats". The reader should guess section content from the heading alone.
- **Topics start with summaries.** Every page opens with a one-paragraph TL;DR. Every major section opens with a summary sentence. Readers who scrolled here from search should know whether to keep reading by the end of the first line.
- **Acronyms spelled out on first use.** "Content Security Policy (CSP) blocks inline scripts". Subsequent uses can be just CSP.

## Lists

- **Three or more list-shaped items in a paragraph: convert to a list.** Otherwise prose.
- **Bulleted for unordered; numbered for ordered.** Numbered for lifecycles, sequential steps.
- **Always introduce a list with a colon.**
- **No periods on list items unless they're full sentences.**
- **Bold/description format.** `- **Term**: description here`. Colon after the bold term.

## Code

- **Language tag on every code block.** Syntax highlighting depends on it.
- **TypeScript first.** Default for new code unless the surface is genuinely language-agnostic.
- **`<Steps/>` for multi-step flows.** Wrap consecutive code blocks so the reader sees the structure visually.
- **Highlight load-bearing lines.** ` ```typescript {8-12,23-37} `.
- **80 columns per line, 25 lines per snippet.** Split longer blocks with prose.
- **Omit defaults.** Don't repeat variable definitions; use a shared variable.
- **Minimal comments in code.** Prefer prose explanation between blocks.
- **Always explain what each code block does.** Don't drop and run.
- **No "see the full example file" references.** The guide is the deliverable. All code lives inline.

## Models in examples

- **Always use the latest model strings.** `anthropic/claude-opus-4-7`, not `anthropic/claude-sonnet-4` or older.
- **Image generation default.** `google/gemini-3.1-flash-image-preview`.

## Placeholders, units, & numbers

- **Text placeholders are `snake_case`, descriptive.** `your_access_token_here`. The reader can double-click to select the entire placeholder before pasting their real value.
- **Number placeholders count up.** `1234567890123`. Recognizable as fake, predictable, clearly not a real ID.
- **Never `<TOKEN>`, `xxx`, `your-token`, `ABC123`.**
- **Data sizes get a space and an uppercase unit, except seconds.** `64 KB`, `5 KB`, `200 ms`, `30s`. Consistency across the corpus lets readers develop scanning habits.
- **Numerals for counts.** "8 deployments", not "eight".

## Typography

- **Never em dashes (`—`) or dashes (`-`) as punctuation.** Use colons, commas, periods, or rephrase the sentence.
- **Curly quotes** (`"` `"` and `'` `'`), not straight (`"` or `'`).
- **Ellipsis character** (`…`), not three dots (`...`).
- **Loading states end with `…`.** `Loading…`, `Saving…`, `Generating…`.
- **Non-breaking spaces for glued terms.** `10&nbsp;MB`, `⌘&nbsp;K`, brand names like `Vercel&nbsp;SDK`.
- **`&` over `and`** only where space-constrained (nav labels, buttons).

## Source formatting

- **Don't hard-wrap paragraphs.** Each paragraph is one line in source; let the editor wrap.
- **One blank line before headings, one before and after code blocks.** No extra blank lines between elements that aren't paragraph breaks.
- **No `---` horizontal rules between sections.** Use headings for structure.

## Links

- **Anchor text names the destination.** Never bare URLs or `here`/`link`.
- **Dashboard deep links use the standard format** (Vercel-specific): `https://vercel.com/d?to=%2F%5Bteam%5D%2F~%2Fai-gateway%2Fapi-keys&title=AI+Gateway+API+Keys`.
- **Link to canonical product docs where relevant** (Vercel-specific): `https://vercel.com/docs/vercel-sandbox`, `https://vercel.com/docs/ai-gateway`; AI Gateway model catalog: `https://vercel.com/ai-gateway/models`.

## Emphasis

- **Bold means UI element or critical fact.** Not emphasis-for-emphasis-sake. If you reach for bold for tone, the sentence is weak; rewrite it.
- **Inline code for paths, file extensions, identifiers, short snippets.** `/api`, `.tsx`, `body`, `query`, `req`. Rule: if it would look weird without a monospace font, monospace it.

## Pricing & money pages

- **Uncompromising detail.** Err on the side of "too much".
- **Use tables for pricing.**
- **Never assume the reader knows the pricing model** or whether their workload counts as one invocation or several.
- **Clarity and transparency above all else.** This is the one place to over-explain.

## AI workflow

- **You are accountable for the content you produce, however it is created.** A page drafted by an LLM is your page once you ship it.
- **You are the final arbiter.** The model proposes; you dispose.
- **Hold technical accuracy to a high standard.** Docs are also consumed by LLMs. Wrong docs train wrong models.
- **Use only enterprise models that do not train on your data.** Especially when documenting unreleased products.
- **Disclose AI use in the PR.** The model used, the prompts if useful. The team learns which workflows actually work.
- **Plan first by hand.** The plan is the spec the model works against.
- **Use plan-mode in your editor** (Cursor, Claude, or similar). See the model's plan before it starts writing.
- **Test the page with a prompt.** "Given this plan's goal, can the model complete the task using only this page?" The model becomes your first reader.
- **Final human review, always.**

## Review

- **PR description links the plan, lists what to review, and links the preview URL.** Ping the team via the PR, not the plan or preview directly.
- **Author is accountable, not the reviewer.** Reviewers can flag, but the author decides. Reviewers are liberal with approvals; iteration speed matters more than gatekeeping.
- **Suggestion comments for small text fixes.** Preview comments for anything bigger, so the comment carries rendered context.
- **Disagreement is fine.** Reject with a one-line reason and move on. Follow-up issues for anything that won't land in this PR.
