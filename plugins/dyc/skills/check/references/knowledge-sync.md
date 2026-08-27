# Knowledge Sync

Loaded from `check` when a review finding recurs, or when the diff introduces invariants not yet captured in project docs. Promote the invariant to a durable rule; do not report it a third time.

A finding raised for the second time — by this review or by a prior review whose finding recurs — is promoted from finding to durable rule as part of the current run: write the invariant into the project's public docs or rules instead of reporting it a third time. Recurrence is the promotion trigger; a first-time finding stays a finding.

After reviewing the diff, check whether it introduces invariants not yet captured in project docs:

- New safety gate or path-guard rule → AGENTS.md
- New UI constraint (layout rule, animation, overlay registration) → `.claude/rules/*.md`
- New deploy/release step or artifact → AGENTS.md or `docs/`
- New cross-file sync requirement (enum ↔ HTML anchors, Swift keys ↔ xcstrings) → AGENTS.md
- One-off review reports or diagnostic snapshots should not become durable docs as-is; extract the stable rule into AGENTS/CLAUDE/rules/references and drop the stale report from the commit.

## Snapshot Report Routing

Treat review reports, scorecards, and diagnostic snapshots as evidence, not as source-of-truth docs. Before approving one:

1. Re-read the current diff or repo surface named by the report. If the claim is stale, exclude the report from the commit or rewrite it into a stable rule.
2. Keep project-specific commands, paths, protected areas, release rituals, and safety constraints in that project's public context. Do not promote them into the shared skill set.
3. Promote only transferable review behavior into the shared skill set: e.g. "check untracked files before readiness", "inspect generated package contents", or "turn one-off reports into invariants."

If found, either apply the doc update as `safe_auto` (when the invariant is clear from the diff) or flag it in the sign-off as `doc debt`. When no new invariants exist, sign-off says `doc debt: none`.
