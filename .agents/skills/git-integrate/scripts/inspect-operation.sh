#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "Not inside a git repository." >&2
    exit 1
fi

operation=""
state_dir=""
if [[ -d "$(git rev-parse --git-path rebase-merge)" || -d "$(git rev-parse --git-path rebase-apply)" ]]; then
    operation="rebase"
    if [[ -d "$(git rev-parse --git-path rebase-merge)" ]]; then
        state_dir="$(git rev-parse --git-path rebase-merge)"
    else
        state_dir="$(git rev-parse --git-path rebase-apply)"
    fi
elif [[ -f "$(git rev-parse --git-path MERGE_HEAD)" ]]; then
    operation="merge"
elif [[ -f "$(git rev-parse --git-path CHERRY_PICK_HEAD)" ]]; then
    operation="cherry-pick"
elif [[ -f "$(git rev-parse --git-path REVERT_HEAD)" ]]; then
    operation="revert"
fi

branch="$(git branch --show-current)"
if [[ -n "$branch" ]]; then
    printf 'Current branch: %s\n' "$branch"
else
    printf 'Current branch: (detached HEAD)\n'
fi
printf 'HEAD: %s\n' "$(git rev-parse --verify HEAD)"

if [[ -n "$operation" ]]; then
    printf 'Active operation: %s\n' "$operation"
else
    printf 'No rebase, merge, cherry-pick, or revert in progress.\n'
fi

if [[ "$operation" == "rebase" ]]; then
    for field in head-name onto stopped-sha msgnum end; do
        if [[ -f "$state_dir/$field" ]]; then
            printf 'Rebase %s: %s\n' "$field" "$(<"$state_dir/$field")"
        fi
    done
fi

for ref in REBASE_HEAD MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
    if value="$(git rev-parse --verify -q "$ref" 2>/dev/null)"; then
        printf '%s: %s\n' "$ref" "$value"
    fi
done

sequencer_dir="$(git rev-parse --git-path sequencer)"
if [[ -f "$sequencer_dir/todo" ]]; then
    printf 'Sequencer todo:\n'
    sed -n '1,10p' "$sequencer_dir/todo"
fi

staged=()
while IFS= read -r -d '' file; do
    staged+=("$file")
done < <(git diff --cached --name-only --diff-filter=ACDMRTB -z)

if [[ ${#staged[@]} -eq 0 ]]; then
    printf 'No staged paths.\n'
else
    printf 'Staged paths (%d):\n' "${#staged[@]}"
    for file in "${staged[@]}"; do
        printf ' - %q\n' "$file"
    done
fi

conflicted=()
while IFS= read -r -d '' file; do
    conflicted+=("$file")
done < <(git diff --name-only --diff-filter=U -z)

if [[ ${#conflicted[@]} -eq 0 ]]; then
    printf 'No unmerged paths.\n'
    if [[ -n "$operation" ]]; then
        printf 'The operation may be paused for a non-conflict reason; inspect git status and operation metadata before continuing.\n'
    fi
    exit 0
fi

printf 'Conflicted files (%d):\n' "${#conflicted[@]}"
for file in "${conflicted[@]}"; do
    printf ' - %q\n' "$file"
done

printf '\nUnmerged index stages:\n'
git ls-files -u

printf '\nConflict marker locations:\n'
for file in "${conflicted[@]}"; do
    printf '==> %q\n' "$file"
    if command -v rg >/dev/null 2>&1; then
        rg -n -- "^(<<<<<<<|=======|>>>>>>>)" "$file" || true
    else
        grep -nE -- "^(<<<<<<<|=======|>>>>>>>)" "$file" || true
    fi
    printf '\n'
done
