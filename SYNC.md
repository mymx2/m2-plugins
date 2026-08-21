# Sync Info

Tracked upstreams for ongoing distillation. Both are vendored as git submodules under `vendor/`; the SHAs below record what the current tree was distilled against.

## addyosmani/agent-skills

- **Source:** `vendor/agent-skills`
- **Upstream:** https://github.com/addyosmani/agent-skills
- **Git SHA:** `f1edb2e05487d0aa6d93c747141e0aed1187f25`
- **Synced:** 2026-08-21

## tw93/Waza

- **Source:** `vendor/waza`
- **Upstream:** https://github.com/tw93/Waza
- **Git SHA:** `30bf563ccba94652081b53a0d574ef91c32516ee`
- **Synced:** 2026-08-21
- **Note:** upstream history was rewritten (force-push); the earlier distillation base `55ded9b` is unreachable. Tracking restarts from `30bf563c`; the original 8-skill migration predates it and cannot be diffed against this base.

## Updating

1. `git submodule update --remote vendor/<name>`
2. Diff the new upstream state against the SHA recorded here and decide what to distill.
3. Update the SHA and date above, and commit the submodule pointer together with this file.
