# Safety Baseline Checks

Loaded from `health` Step 1c on every audit. These checks are the floor, not the ceiling.

## Deny-list floor

Apply this only when the runtime actually enforces the rule shape being recommended: agent permission settings, hook settings, MCP settings, allowed/denied tools, or a documented autonomous-agent launcher. In that case, the settings should deny, at minimum: credential and key directories (SSH, cloud providers, GPG, gh CLI), credential-bearing files (`credentials*`, `secrets*`), and pipe-to-shell installers. Treat `.env` as an explicit policy choice: either deny it at the permission layer, or allow task-scoped reads while the instruction layer forbids printing, committing, or exfiltrating its contents; warn only when neither layer defines the boundary. Report missing categories as one concise WARN; let the reviewer fill in exact local paths.

Three calibrations:

1. Prefix/glob permission rules cannot reliably match pipes, so recommend the host's pre-execution hook for pipe-to-shell blocking instead of inventing glob variants, and name the hook's own tradeoff (string-matching hooks also fire on quoted text and heredocs that merely contain the pattern).
2. Before predicting an outbound-shell deny's blast radius, check which layer it matches at: a command-prefix deny on `ssh` only blocks the agent invoking `ssh` directly and leaves git's internal SSH transport alone, while a process- or sandbox-level block does break git-over-SSH push.
3. When a runtime has no command-level deny surface (Codex: the levers are `sandbox_mode` and `approval_policy`), name that lever once as a user tradeoff instead of recommending deny keys the runtime cannot express.

If no agent settings surface exists at all, report the deny-list as not applicable rather than a failure.

## Permission-layer vs instruction-layer gating

An allowlist entry for a git write action (`git push`) next to an instruction-layer rule ("push only when the user says so") is not automatically a contradiction: instructions decide when the action happens, permissions decide whether it re-prompts, and a user who explicitly authorizes pushes every session may keep push in allow deliberately to avoid double confirmation. Calibrate by reversibility and the user's own rules: actions the instructions forbid outright (`git reset --hard`, `git stash`, force-push) belong in deny or ask; routine explicitly-authorized actions stay where the user put them, reported at most as a note. Escalate only when auto mode plus skipped prompts plus broad allow lets a write action run with zero user input in a session, and even then present the friction tradeoff for the user to choose instead of silently moving entries.

## Environment override surface

Treat the following as attack surface, report when set in tracked files or shipped settings without a justification comment: API base-URL overrides (redirect all traffic to a third party), auto-trust flags for project-local MCP servers, wildcard tool allowlists (`allowedTools: ["*"]`), and permission-skip flags (`--dangerously-skip-permissions` or equivalents). Print file:line and the key name only; never print secrets.
