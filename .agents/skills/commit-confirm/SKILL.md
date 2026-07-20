---
name: commit-confirm
description: Opt-in approval-first, whole-working-tree wrapper for the commit skill. Defaults to grouping all changes and requires the commit skill; selected installs must also install commit. Activate only when the user explicitly invokes `$commit-confirm` or explicitly asks to use the named commit-confirm skill. Do not activate merely because the user asks to review or propose commits, ask before committing, or wait for "go".
---

# Commit Confirm

Use this wrapper only after the explicit opt-in described in the frontmatter. A normal approval-first commit request does not opt in to this skill or its whole-working-tree default.

Use this skill to run `$commit` in approval-first mode, defaulting to the whole working tree.

Before starting, load and follow `$commit`. This skill overrides its default scope and approval behavior; `$commit` owns working-tree inspection, grouping, message style, staging, committing, and reporting.

Selected installs do not install dependencies automatically. If `$commit` is not installed or available, stop before staging or committing. Tell the user to install it with:

```bash
npx skills add LegendApp/legend-skills --skill commit
```

Then ask them to retry after installation.

## Scope And Approval Override

When using `$commit`, force plan mode:

- Unless the user requests a narrower scope, use all-changes mode: inspect staged, unstaged, and untracked changes as the pool to group. Preserve explicit exclusions.
- If the user names a subset or asks for only the current agent's changes, honor that narrower scope.
- Always present a commit plan first and wait for explicit approval such as `go`.
- Do not stage or commit before approval, even if there is only one logical commit.
- After approval, create all agreed commits without asking again unless the working tree changes unexpectedly.
- Treat `go` after a previously presented plan as approval for that plan, then re-check the working tree before staging.
