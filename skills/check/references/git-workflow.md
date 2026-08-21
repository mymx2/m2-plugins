# Git Workflow & Versioning

Load when reviewing commits, branches, or release/versioning decisions. Git is your safety net — commits as save points, branches as sandboxes, history as documentation.

## Commit Discipline

- **Commit early, commit often.** Each successful increment gets its own commit; don't accumulate large uncommitted changes.
- **Atomic commits.** Each commit does one logical thing. A commit that "adds feature, fixes sidebar, updates deps, refactors utils" is a failure.
- **Descriptive messages.** Explain the _why_, not the _what_. Format: `<type>: <short description>` + body explaining why. Types: `feat`/`fix`/`refactor`/`test`/`docs`/`chore`.
- **Keep concerns separate.** Don't mix formatting with behavior, or refactors with features — separate commits, ideally separate PRs.
- **Size your changes.** ~100 lines per commit/PR; ~300 acceptable for one logical change; ~1000 → split.

## Trunk-Based Development (Recommended)

Keep `main` always deployable; short-lived feature branches merged within 1–3 days. Branch from `main` (or the team's default branch); delete branches after merge; name them `feature/<x>` / `fix/<x>` / `chore/<x>` / `refactor/<x>`. Long-lived branches are hidden costs (diverge, conflict, delay integration). Release branches are acceptable for stabilization; **prefer feature flags over long branches** for incomplete features.

## Pre-Commit Hygiene

Check `git diff --staged`; ensure no secrets (`grep -i "password\|secret\|api_key\|token"`); run tests, lint, type check. Have a `.gitignore` covering `node_modules/`, `dist/`, `.env`, `.env.*.local`, `*.pem`, `*.key`. Commit generated files only if the project expects them (lockfiles, migrations); never commit build output, env files, or IDE config (`.vscode/settings.json` unless the team shares it).

## Using Git for Debugging

`git bisect` to find the commit that introduced a bug; `git log --oneline -20` / `git diff HEAD~5..HEAD` for recent changes; `git blame` for who changed a line; `git log --grep` to search messages.

## Worktrees for Parallel Agent Work

For parallel agent work, use `git worktree add ../project-<name> <branch>` so each agent gets its own directory on its own branch — no branch switching, changes isolated until explicitly merged, and a failed experiment is deleted with `git worktree remove` at no cost.

## Change Summaries

After any modification, provide a structured summary with three sections: `CHANGES MADE` (file: what changed), `THINGS I DIDN'T TOUCH` (intentionally — related issues left alone because they're out of scope), and `POTENTIAL CONCERNS` (assumptions, new dependencies, behavior changes to confirm). The "didn't touch" section is the evidence of scope discipline — it proves the agent didn't go on an unsolicited renovation, and it catches wrong assumptions early.

## Release & Versioning

A version is how _consumers_ track change; semantics matter:

- **SemVer:** MAJOR = breaking (consumers must change); MINOR = additive backward-compatible; PATCH = bugfix backward-compatible. When unsure whether a change is breaking, assume it is — a surprise major is cheaper than a broken consumer. A "patch" that changes relied-on behavior is a major in disguise (Hyrum's Law).
- **Tag the release** — a release is an immutable point in history; derive the version from the tag rather than hand-editing it in scattered files so artifact/tag/changelog can't disagree.
- **Keep a changelog for humans** — curated, grouped `Added/Changed/Fixed/Deprecated/Removed/Security`, newest on top, phrased around user impact. Write the entry with the change, not reconstructed at release time.

## Red Flags

- Large uncommitted changes; messages like "fix"/"update"/"misc"
- Formatting changes mixed with behavior changes
- No `.gitignore`; committing `node_modules/`/`.env`/build artifacts
- Long-lived diverging branches; force-pushing to shared branches
- A breaking change shipped under a minor/patch bump
- A release with no tag, or a version out of sync with the tag; a user-facing release with no changelog entry
