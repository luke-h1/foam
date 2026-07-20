---
name: git-integrate
description: Safely start new or continue in-progress Git integration and history operations through verified completion. Use when asked to run or resume a rebase, merge, cherry-pick, or revert; when Git is already in the middle of one of those operations; or for interruption recovery, conflict resolution, ours/theirs interpretation, and deciding when user guidance is required. Continue a detected active operation before considering new work, never choose the integration method, and never guess an unclear next action or resolution.
---

# Git Integrate

Own a rebase, merge, cherry-pick, or revert through verified completion. If one is already in progress, take it over and continue or repair it before considering new work. Otherwise, safely start the operation explicitly requested by the user. This is not a general Git command runner: do not choose an integration strategy or perform unrelated commit, branch, stash, reset, remote, or worktree maintenance.

> **Hard stop:** For new work, proceed only when the requested operation and history shape are 100% clear. For an in-progress operation, continue it without requiring the user to restate its method or target when Git state makes the operation and next action clear. Resolve a conflict only when its intended result is also clear from repository evidence. Otherwise stop before mutating Git or files and ask the user with concrete options. Never choose a default; an incorrect history operation or resolution is worse than an interruption.

## Workflow

1. **Inspect state.** Run full `git status`, `git status --short --branch`, and `scripts/inspect-operation.sh` when available. Record the current branch and `HEAD`. Resolve `rebase-merge`, `rebase-apply`, `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, and the sequencer directory with `git rev-parse --git-path`.

   Active Git state determines the operation to continue; do not start another or ask the user to choose a new method or target. It does not by itself establish the intended combined behavior or prove that `--continue` is the correct immediate action.

2. **Continue an active operation.** Read `git status`, the operation metadata and todo state, the current operation commit, unmerged index stages, staged changes, and working-tree changes. Determine whether the operation is ready to continue or stopped for a conflict, an edit instruction, a failed exec, an empty commit, a pending commit, or another reason.

   Route conflicts through the resolution workflow below. For an edit or failed exec, verify the requested edit or command result before continuing. For an empty commit, require explicit approval before keeping, dropping, or skipping it. If the stop reason or next action is unclear, preserve the exact state and ask; never blindly continue an operation merely because it is active.

3. **Preflight a new operation.** With no active operation, require an explicit method and enough information to determine its exact history effect:

   - Rebase: current or named source branch, upstream, commits to replay, and whether the request requires `--onto`, `--rebase-merges`, `--update-refs`, autosquash, or another non-default form.
   - Merge: source and target plus the intended fast-forward policy: `--ff-only`, allow a fast-forward, or require a merge commit with `--no-ff`.
   - Cherry-pick: exact commits, order, and whether an empty result should stop, drop, or be kept.
   - Revert: exact commits, order, and the confirmed `-m <parent>` for every merge commit.

   Resolve named refs to commit IDs and inspect the merge base, divergence, commits, and relevant diff before mutating history. Identify pre-existing staged, unstaged, and untracked changes; proceed with them present only when their ownership and non-interaction are clear. Fetch only the required remote or ref when freshness matters. Inspect behavior-affecting configuration such as `merge.ff`, `rebase.autoStash`, `rebase.rebaseMerges`, `rebase.updateRefs`, and `rerere.enabled`; use explicit flags or ask when configuration would materially change the result.

   Do not default to rebase, choose a topology, switch branches, stash changes, or simplify a requested complex operation without approval. Record the original branch, `HEAD`, and relevant refs so the final history can be compared.

4. **Start the confirmed operation.** Construct the command from the confirmed history shape rather than forcing every request through a simple form. Basic forms include `git rebase <upstream>`, `git merge --no-edit --ff-only <source>`, `git merge --no-edit --ff <source>`, `git merge --no-edit --no-ff <source>`, `git cherry-pick <commits>`, and `GIT_EDITOR=true git revert <commits>`. Add variant flags or `-m <parent>` only when confirmed. Run non-interactively when doing so preserves the requested commit messages and behavior.

5. **Inspect every conflict before editing.** Check `git diff --name-only --diff-filter=U`, `git ls-files -u`, `git diff --cc`, markers, and the exact change represented by `REBASE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, or `MERGE_HEAD`. Use surrounding history, callers, tests, and docs to state the intended result and evidence for every path.

   If any result is not 100% clear, resolve nothing. Report the exact Git state and paths, explain the competing intents and evidence, and offer concrete options. You may identify the likeliest option but must not select it. Always ask for divergent behavior, unclear delete/modify conflicts, uncertain binary/lock/generated files, competing refactors or evidence, and missing mainline parents. Formatting, imports, non-overlapping edits, moves, and generated files are direct only when repository evidence verifies the result.

6. **Resolve and verify.** Treat staged resolutions, `rerere`, merge drivers, and automatic resolutions as untrusted proposals. Once every path is clear, edit the files, regenerate generated output from its source, remove all markers, and stage only resolved paths. Verify no unmerged entries remain, review the staged resolution, and run the fastest meaningful focused check when the intermediate state is testable. Never accept `ours`, `theirs`, union merge, or generated output wholesale without independent verification.

7. **Continue the in-progress operation.** When Git state shows that the current step is ready, including after resolving a conflict or confirming a pending operation commit, use the matching command:

   - `GIT_EDITOR=true git rebase --continue`
   - `GIT_EDITOR=true git merge --continue`
   - `GIT_EDITOR=true git cherry-pick --continue`
   - `GIT_EDITOR=true git revert --continue`

   Reinspect state after every continuation. Apply the same classification and hard stop to each subsequent pause; do not use `--continue` for a different stop reason without verifying its required action.

8. **Verify completion.** Confirm the operation state files are gone, the final branch and `HEAD` are expected, and the requested commits and topology are present without accidental drops or duplicates. For a non-trivial rebase, compare the old and new series with `git range-diff` or equivalent evidence when practical. Run focused validation, inspect final status and remaining changes, then report the operation, resolved paths, history verification, validation, and remaining tree state.

## Ours And Theirs

- Rebase: `ours` is the accumulated rebased result on the new base, including commits already replayed; `theirs` is the commit currently being replayed.
- Merge: `ours` is the current branch; `theirs` is the branch being merged.
- Cherry-pick: `ours` is the current `HEAD`, including earlier picks in the sequence; `theirs` is the commit being applied.
- Revert: infer nothing from the labels; compare current `HEAD`, the reverted commit, its selected parent, and the index stages.

## Safety

Never use destructive resets, abort or quit an operation, skip or drop commits, overwrite unrelated changes, or change the requested history topology without explicit approval. If completion is unclear or unsafe, preserve the exact state and ask whether to provide resolution guidance, use the matching recovery command, or choose another integration strategy.

`scripts/inspect-operation.sh` prints the active operation, current branch and commit, operation metadata, staged and conflicted paths, index stages, and marker locations.
