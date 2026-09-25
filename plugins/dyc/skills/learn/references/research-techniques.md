# Research Techniques: Divergence, Convergence, and Anti-Patterns

Load when a research task needs more than fetch-and-digest: when the question is still fuzzy (divergence tools), when sources conflict or vary in reliability (convergence tools), or when comparing external entities like libraries, tools, approaches, or competitors. These techniques bolt onto the six-phase workflow: divergence feeds Phase 1, convergence strengthens Phase 2, the anti-patterns gate Phase 6.

## Divergence Tools (Phase 1, when the question is underexplored)

- **SCAMPER** — seven verbs to force new angles on a topic: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse. Run each verb against the subject to surface sub-topics a keyword search would never name.
- **5 Whys with branching** — ask why recursively, and when a layer has two answers, follow both branches. Each layer should produce a candidate explanation, not just a deeper restatement. Stop when the answer leaves the domain you can act on.
- **Reverse brainstorm** — ask "how would we make this fail / make it worse?" and enumerate answers, then invert each into a research question. Cheaper than direct brainstorming for finding blind spots, because failure modes are easier to name than success modes.
- **Constraint flip** — list the constraints everyone assumes (budget, latency, platform), remove one at a time, and ask what the problem looks like then. Solutions that only exist under a flipped constraint often reveal what the constraint is really protecting.

## Convergence Tools (Phase 2, when material piles up)

- **Triangulation** — a claim earns confidence from three independent directions: method triangulation (different evidence types agree), source triangulation (independent sources with no shared origin agree), time triangulation (the claim held across separated observations). One source saying it twice is not two sources.
- **Confidence grading** — label every load-bearing claim high / medium / low: high = triangulated or primary-source direct evidence; medium = single credible source or indirect evidence; low = single secondary source, vendor claim, or inference. Low-confidence claims can appear in the output but must carry their label.
- **Affinity clustering then thematic coding** — dump every extracted fact onto cards, cluster by natural affinity without pre-set categories, then name each cluster. Code claims at three levels: open (what was said), axial (what theme it belongs to), selective (which core argument it supports). Facts that fit no cluster are outliers to investigate, not delete.

## Comparing External Entities

When the research compares libraries, tools, vendors, or approaches, structure the comparison before collecting:

- **Dimension matrix** — fix the comparison dimensions first (fundamentals, capabilities, cost model, reputation, strategy) so every entity gets the same questions. Freeform per-entity notes produce comparisons that cannot be read across.
- **Credibility-marked cells** — every cell carries its source grade; a vendor's own benchmark goes in as low credibility, not as fact.
- **Three-layer takeaway** — close every comparison with: where to match the leader (table stakes), where to differ deliberately, where to leapfrog. A comparison that ends with a feature matrix and no stance is half done.

## Research Anti-Patterns (Phase 6 gate)

Red flags that invalidate conclusions even when sources looked solid. The one-line executable checklist is inlined in SKILL.md Phase 6; this section is the expanded explanation.

- **Simpson's paradox** — a trend visible in every subgroup reverses when the groups merge (or vice versa). Before quoting an aggregate, check the per-segment story. Applies when the draft cites aggregated quantitative data over a grouped population (cohorts, segments, time buckets); qualitative research with no grouped numbers is N-A — record why instead of forcing the check.
- **Survivorship bias** — the sample only contains what survived (successful projects, retained users, answered surveys). Ask what the missing cases would say.
- **Vanity metrics** — numbers that go up regardless of health (total signups, page views). A metric is only evidence if a bad outcome could move it down; if no bad outcome can move it down, it is context, not evidence.
- **Goodhart's law** — once a measure becomes a target, it stops measuring. Two observable signals: the source reporting the metric is the party being measured on it, or the metric is bound to KPI, OKR, or funding narratives. If either holds, discount the figure and corroborate from a party with no stake in the metric.
- **Base-rate neglect** — a striking rate or ratio quoted without the base rate of the underlying population. "90% of X are Y" means nothing until you know how common Y is overall. If no source provides the base rate, label the claim low confidence; do not invent a number to fill the gap.

---

_Divergence/convergence frameworks distilled from PM brainstorm, feedback-analysis, and competitive-analysis frameworks; anti-patterns from a PM metrics-retrospective trap list._
