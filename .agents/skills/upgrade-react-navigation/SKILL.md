---
name: upgrade-react-navigation
description: Upgrade React Navigation to a new major version (6.x to 7.x or 7.x to 8.x), applying the required breaking changes — peer-dependency and tooling bumps, and renamed or removed navigate, linking, theme, navigator, and screen-option APIs — while preserving navigation behavior.
---

# Upgrade React Navigation

## Goal

Upgrade React Navigation to the next major version and handle all required breaking changes while preserving existing navigation behavior.

## When to use

You are upgrading React Navigation major version (6.x -> 7.x or 7.x -> 8.x).

## Adaptation policy

Treat the patterns in this skill as canonical starting points, not an exhaustive list. The absence of an exact matching example is not a blocker.

- Map local code to the closest pattern here and adapt it; infer an equivalent when the structure differs.
- Prefer the simplest upgrade that preserves behavior.
- Keep changes minimal and upgrade only the affected code.

## When to ask for clarification

Inspect the local code first.

If, after reading the relevant navigator and the upgrade reference, you cannot determine with high confidence whether an API changed or how to update it, pause and ask the user before editing code.

Ask for clarification when:

- A navigator uses APIs that are not covered in the official documentation or the upgrade reference.
- The upgrade would require assumptions about which behavior changes are acceptable.

## References

Check `@react-navigation/native` in `package.json` first.

- If `6.x`, read [`references/upgrade-6-to-7.md`](./references/upgrade-6-to-7.md)
- If `7.x`, read [`references/upgrade-7-to-8.md`](./references/upgrade-7-to-8.md)
- For any other version, follow the [upgrade guides](https://reactnavigation.org/docs/upgrade-guides.md) to move to 7.x or 8.x first.

Load exactly one reference file unless explicitly comparing versions.

## Verification

After upgrading:

- Determine the package manager from `package.json` or the lockfile.
- Run the existing type checker, linter, and relevant tests when scripts are available.
- Work through the "Automated checks" and "Manual checks" in the loaded reference. If a step cannot run, report why.
