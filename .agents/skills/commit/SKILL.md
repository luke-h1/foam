---
name: commit
description: Commit the current agent's changes by default, or all working-tree changes when explicitly requested, with clean logical grouping and repository commit-message conventions. Use when the user asks to commit changes, commit this work, commit all changes, split changes into commits, propose commit messages, or wait for "go" before committing.
---

# Commit

Use this skill to turn the requested changes into one or more clean commits without absorbing unrelated work.

## Scope

- **Default:** commit only changes made by the current agent in the current task. Determine ownership from the known starting state, conversation, and tool history; do not infer it merely from the current diff or file path.
- **All changes:** inspect and commit the whole working tree only when the user explicitly asks to commit all, everything, or the whole tree.
- **Explicit subset:** honor any files, hunks, commits, or exclusions named by the user.
- **Temporary artifacts:** exclude investigation-only diagnostics, logs, traces, profiler output, experimental toggles, screenshots, and repro fixtures unless explicitly requested. Keep permanent regression tests; ask if unclear.
- If change ownership or the requested boundary cannot be determined reliably, stop before staging and ask. Never include pre-existing, concurrent, or user-authored changes by guesswork.

## Approval Modes

- **Direct mode**: If the user asks to commit, analyze the requested scope and create the needed commit or commits without asking for a separate "go".
- **Plan mode**: If the user asks for a plan, asks to review commits first, says to wait, says to prompt or ask before committing, or otherwise requests approval first, present a commit plan and wait for explicit approval such as `go` before staging or committing. After approval, create all agreed commits without asking again unless the working tree changes unexpectedly.
- **Clarification stop**: In any mode, stop before committing if ownership is unclear, mixed hunks cannot be staged safely, repository guidance conflicts with the user's request, or the intended grouping is ambiguous enough that committing would risk losing user intent.
- **Approval response**: If a previous turn presented a commit plan and the user now says `go`, treat that as approval for that plan. Re-check the working tree before staging.

## Inspect

1. Read repository guidance first: `AGENTS.md`, contribution docs, or visible commit conventions.
2. Determine whether the work fixes a known GitHub issue from explicit user context, an approved issue/task document, a verified issue URL, or repository metadata. Do not infer an issue relationship from an incidental number alone.
3. Inspect state with `git status -sb`, `git diff --stat`, `git diff --staged --stat`, and targeted `git diff` / `git diff --staged`. Inspect relevant untracked files before staging them.
4. Classify staged, unstaged, and untracked changes as in or out of scope. Task ownership does not imply inclusion; classify task-created instrumentation and fixtures as permanent or temporary before staging. Treat the full tree as context, not as permission to commit it.
5. Preserve out-of-scope staged changes. If scoped changes occupy fully owned paths, a path-limited commit may leave unrelated index entries intact; if scoped and unrelated hunks share a path or safe isolation is uncertain, stop and ask rather than unstaging or committing someone else's work.
6. Respect explicit exclusions, such as debug logs or generated artifacts the user said not to commit. Leave excluded changes unstaged and report them afterward.
7. If there are no in-scope changes, say so and report any remaining out-of-scope changes without committing them.

## Group

Group the in-scope changes by one coherent concept: feature, fix, refactor, test, docs, config, dependency, or subsystem. Prefer separate commits when changes would be reviewed, reverted, or explained independently.

If a file contains unrelated changes, split by hunk with `git add -p` or another path/hunk-limited staging method. Do not put unrelated hunks in one commit just because they share a file.

## Message Style

Follow explicit user instructions and repository or workspace guidance when present; they override this skill's defaults. Otherwise use this default:

- Conventional Commit `type: subject`
- no scope parentheses
- imperative, concrete subject
- no trailing period
- no `Co-authored-by` trailer unless the user explicitly asks
- when the commit fixes a verified GitHub issue, append ` #<number>` to the end of the subject

Use the issue suffix only when the commit is intended to fix that issue, not merely when it is related or discovered during investigation. For multiple explicitly fixed issues, append each verified reference at the end. Repository-specific message rules or explicit user instructions still take precedence.

Good:

```text
fix: preserve scroll offset after prepend
fix: preserve failed CRUD creates #547
feat: add commit planning skill
docs: document skills install flow
```

Avoid:

```text
fix(list): preserve scroll offset
update stuff
chore: misc.
```

When the work explicitly fixes issue #547, `fix: preserve failed CRUD creates` is also incomplete because it omits the verified issue suffix.

Use a body for behavioral changes when the reason, invariant, or validation would not be obvious from the title.

## Plan Output

When plan mode is active, present:

```text
Proposed commits (N):
1. type: concrete subject
   Rationale: Why this group belongs together.
   Files: path/a, path/b
```

Then ask for `go` or edits. Do not stage or commit until the user approves.

In direct mode, do this planning internally. Only show a concise summary before or while committing if it helps the user follow a multi-commit split.

## Commit

For each group:

1. Stage only that group using path-limited or hunk-limited staging. Do not silently unstage out-of-scope changes.
2. Verify the intended commit contains only that group with `git diff --staged --stat`, targeted `git diff --staged`, and `git diff --staged --check`. When unrelated index entries remain, use a path-limited commit only for fully owned paths and verify those paths separately.
3. Commit with the agreed message.
4. Re-check the tree after hooks run, then continue to the next group.

After all commits, report commit hashes and any remaining unstaged files. If a commit fails, stop and report the exact failure and the current git state.
