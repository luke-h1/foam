---
name: adversarial-review
description: >-
  Run split-context adversarial review on code changes — Bugbot, security review,
  repo contract checks, and react-doctor (changed-scope scan), then apply fixes
  from serialized findings. Use after implementing a feature or fix, before merge,
  when finishing a ticket, or when the user asks for adversarial review.
disable-model-invocation: true
---

# Adversarial Review

Split-context review modeled on the Bun Rust rewrite: **implementers do not review; reviewers do not implement.** Reviewers run in separate subagent contexts (and via react-doctor CLI) and only try to find reasons the change is wrong.

Use after `/implement`, `/tdd`, or any hand-written change set. Pair with `/loop` when driving a ticket to done (see **Ticket loop** below).

## When to use

- User asks for adversarial review, pre-merge review, or "find bugs in my changes"
- End of `/implement` or ticket work, before commit or PR
- A `/loop` tick reports failing checks or open review findings

Do **not** use as the primary spec review — use `/review` for Standards + Spec axes against an issue or PRD. Adversarial review hunts regressions, security issues, repo contract violations, and react-doctor diagnostics on changed code.

## Split roles

| Role | Who | Job |
| --- | --- | --- |
| Implementer | Parent agent (earlier turn) or user | Wrote the code; does not self-review |
| Reviewers | 3 readonly subagents + react-doctor CLI | Find bugs, security issues, contract violations, RN/React diagnostics |
| Fixer | Parent agent (this skill, fix phase) | Reads **only** the serialized review file + diff; applies fixes |

If you implemented the change in this same session, do not defend the code during review. Launch reviewers, then switch to fixer mode using their output alone.

## Process

### 1. Pin the diff

Default: `branch changes` against the repo default branch (merge-base with `main`).

Use `uncommitted changes` when the user asks to review dirty work only.

If reviewing a specific PR or branch, check out that branch first (ask before stashing local changes).

Record:

- `REPO_PATH` — absolute workspace root
- `DIFF_SCOPE` — `branch changes` or `uncommitted changes`
- `BASE_BRANCH` — only when not the default branch
- `REVIEW_ID` — short git SHA: `git rev-parse --short HEAD`

### 2. Run four reviewers in parallel

In **one turn**, start the react-doctor scan and launch **three** readonly subagents concurrently.

#### Reviewer A — React Doctor (CLI)

Run from `REPO_PATH` when the diff touches React/TS/TSX under `src/` (skip only if the change is purely non-React — e.g. scripts-only, markdown-only):

```bash
npx react-doctor@latest --verbose --scope changed
```

Also capture the numeric score for the manifest:

```bash
npx react-doctor@latest --score --scope changed
```

Respect repo config in `doctor.config.json` (ignored paths, rule overrides, disabled rules). Do not treat `deslop/unused-dependency` findings as blocking — those rules are off for `package.json` in this repo because static analysis misses config-plugin and font channels.

Map CLI output to findings:

| react-doctor level | Adversarial severity | Blocking? |
| --- | --- | --- |
| error | high | yes |
| warning | medium | no (fix if cheap) |
| score regression vs base | high | yes |

Each finding: `location` = `file:line`, `source` = `react-doctor`, `rule` = rule id (e.g. `react-doctor/rn-no-raw-text`).

For rule-specific fix recipes during the fixer phase, fetch `https://www.react.doctor/prompts/rules/<plugin>/<rule>.md` or use `/react-doctor`. See [../react-doctor/SKILL.md](../react-doctor/SKILL.md).

#### Reviewer B — Bugbot

Launch exactly one `bugbot` subagent:

- `readonly: true`
- `run_in_background: false`
- `description: "Bugbot"`
- `subagent_type: "bugbot"`

Prompt:

```text
Full Repository Path: <REPO_PATH>
Diff: <DIFF_SCOPE>
Custom Instructions: Adversarial review only. Assume the change is wrong until proven otherwise. Report concrete bugs, regressions, and missing edge cases. Do not suggest style nits unless they hide a bug.
```

#### Reviewer C — Security

Launch exactly one `security-review` subagent:

- `readonly: true`
- `run_in_background: false`
- `description: "Security Review"`
- `subagent_type: "security-review"`

Prompt:

```text
Full Repository Path: <REPO_PATH>
Diff: <DIFF_SCOPE>
Custom Instructions: Adversarial review only. Exhaustively list security issues, trust-boundary mistakes, and unsafe data handling introduced by this diff.
```

#### Reviewer D — Repo contracts

Launch one `generalPurpose` subagent with `readonly: true`:

- `description: "Contract review"`

Prompt:

```text
Full Repository Path: <REPO_PATH>

Review the diff for <DIFF_SCOPE> against this repo's documented contracts.

Read AGENTS.md at the repo root and references/FORBIDDEN.md in the adversarial-review skill folder.

Report every violation with file:line, the rule broken, and why it matters. Adversarial only — do not approve or summarize what's good.

Rejections must include:
- expect.objectContaining or toMatchObject in tests
- it() instead of test()
- Fixtures outside __tests__/__fixtures__/{thing}.fixture.ts
- New $TSFixMe or ts-expect-error without justification
- Paragraph-long comments justifying a workaround (fix the code instead)
- Stubbed implementations that silence errors instead of fixing root cause
- TouchableOpacity / TouchableHighlight instead of Pressable
- Legend State mutations wrapped in useCallback without a React API reason

Under 400 words. Table format: Severity | Location | Rule | Finding
```

If a subagent fails, retry once with the same prompt shape. If it fails again, record the error in the manifest and continue with the other reviewers.

If react-doctor fails to run (network, npx), record `status: error` in the manifest and continue — do not skip Bugbot, security, or contracts.

### 3. Serialize findings

Write `.claude/reviews/<REVIEW_ID>.json`:

```json
{
  "reviewId": "<REVIEW_ID>",
  "diffScope": "branch changes",
  "reviewers": {
    "reactDoctor": {
      "status": "ok",
      "score": 92,
      "scoreRegressed": false,
      "summary": "...",
      "findings": []
    },
    "bugbot": { "status": "ok", "summary": "...", "findings": [] },
    "security": { "status": "ok", "summary": "...", "findings": [] },
    "contracts": { "status": "ok", "summary": "...", "findings": [] }
  },
  "blockingCount": 0,
  "findingCount": 0
}
```

Each finding object:

```json
{
  "severity": "critical|high|medium|low",
  "location": "path/to/file.ts:42",
  "source": "react-doctor|bugbot|security|contracts",
  "finding": "One sentence",
  "rule": "Optional — react-doctor rule id or contract name"
}
```

`blockingCount` = critical + high findings (includes react-doctor errors and score regression). Deduplicate by location + finding text across reviewers.

Print a summary table sorted by severity:

| Severity | Location | Source | Finding |

### 4. Fixer phase

Only if `findingCount > 0` and the user has not said "report only":

1. Read `.claude/reviews/<REVIEW_ID>.json` — do not re-read the implementer conversation for rationale.
2. Fix **blocking** findings first, then medium/low if cheap.
3. For `react-doctor` findings, prefer canonical rule prompts over ad-hoc fixes.
4. Run targeted verification:
   - `npx react-doctor@latest --verbose --scope changed` when React files changed
   - `bun run ts:check` when TS files changed
   - Related jest files when tests changed
   - `bun run lint` when unsure
5. Stage only files you changed for the fix.
6. Re-run **step 2** (react-doctor + all three subagents) on `uncommitted changes` if fixes were substantial; otherwise tell the user what was fixed and what remains.

If the same finding fails **3 fix attempts**, stop and escalate to the user with the manifest path.

### 5. Done criteria

Adversarial review passes when:

- react-doctor reports **no errors** on `--scope changed`, **no score regression**, and
- All three subagents return `status: ok` with zero blocking findings, **or**
- User explicitly accepts remaining low-severity findings

Suggest `/review` next if the work maps to an issue or PRD and spec alignment has not been checked yet.

## Ticket loop

`/loop` works well for **completing a ticket** when done criteria are objective. Use **dynamic** mode, not a blind fixed interval.

### Good fit

- Ticket has a spec (GitHub issue, PRD, clear acceptance criteria)
- Gates are machine-checkable: `ts:check`, `lint`, `test:ci`, react-doctor clean on changed scope, adversarial review clean
- Work breaks into implement → review → fix cycles

### Poor fit

- Ambiguous product decisions or UX sign-off
- Tickets needing external API keys, devices, or human QA mid-flight
- Large design exploration before coding

### Suggested dynamic loop

User prompt example:

```text
/loop dynamic Complete GitHub issue #123: implement, then run adversarial-review, fix all blocking findings, repeat until ts:check, lint, test:ci, and react-doctor --scope changed pass with zero blocking findings. Stop and ask me if blocked 3 times on the same finding.
```

Each iteration:

1. Fetch issue #123 if not already in context (`gh issue view`).
2. Implement the next slice (/tdd or /implement).
3. Run verification commands.
4. Run this skill (reviewers only, then fixer if needed).
5. Commit with message referencing the issue.
6. Re-arm loop:
   - **Primary wake**: CI or local test command exits non-zero → fix
   - **Fallback heartbeat**: 30–60m if waiting on CI

Stop the loop when all gates pass and `.claude/reviews/<REVIEW_ID>.json` has `blockingCount: 0`.

### Combine with existing skills

```text
/tdd → adversarial-review → (fix) → /review since main → commit
```

`/review` checks spec and standards; adversarial-review tries to break the code. `/react-doctor` owns deep triage — adversarial-review only runs the changed-scope regression gate.

## References

- Hard rejection list: [references/FORBIDDEN.md](references/FORBIDDEN.md)
- React Doctor scans and triage: [../react-doctor/SKILL.md](../react-doctor/SKILL.md)
- Repo-wide agent rules: `AGENTS.md` at repository root
- React Doctor config: `doctor.config.json` at repository root
