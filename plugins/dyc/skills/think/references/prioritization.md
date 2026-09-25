# Prioritization: Structured Ranking When "Worth It" Is Not Obvious

框架定义（RICE/ICE/MoSCoW/Kano 打分锚点）以 pm 技能的 prioritization-frameworks reference 为正本；本文件只保留工程取舍场景的判定流程。

Load when Evaluation or Triage Mode faces several competing items and a gut verdict per item is not defensible: roadmap ordering, backlog triage, "which of these 5 features first", or any ranking the user will have to justify to someone else. For a single keep/kill judgment, Evaluation Mode alone is enough; this file exists for multi-item trade-offs.

## Engineering-Side Judgment Flow

1. **Name the framework and the data-availability reason.** Pick RICE/ICE/MoSCoW/Kano per the canonical definitions in the pm skill's prioritization-frameworks reference, based on how much evidence exists — not preference. If the data turns out thinner than assumed mid-scoring, downgrade (RICE → ICE → MoSCoW) and say so. Ranking without a named framework produces numbers nobody can challenge.
2. **Weight engineering cost honestly.** Effort counts the full chain (design + dev + test + integration), plus the engineering-specific costs PM scoring tends to miss: migration risk, blast radius of the change, rollback cost, and the ongoing maintenance surface the item adds.
3. **Flag low-confidence items for experiments.** Any item scored on intuition rather than evidence gets a "validate with a small experiment first" note and the cheapest validation named — it does not silently participate in the ranking.
4. **Close with a decision log.** Record the core trade-off (why A over B), the contested items and why, every low-confidence score with its suggested validation, and which declined items are the likeliest next-cycle candidates. A ranking without its decision log cannot be defended later.
5. **Cut scope in order when capacity falls short.** Nice-to-haves first, then split items and defer the second half, then reduce polish — never add people or slip the date before cutting scope.
