---
name: upgrade-react-navigation
description: Upgrade React Navigation from 6.x to 7.x or from 7.x to 8.x.
---

# Upgrade React Navigation

## Goal

Upgrade React Navigation to the next major version and handle all required breaking changes while preserving existing navigation behavior.

## When to use

You are upgrading React Navigation major version (6.x -> 7.x or 7.x -> 8.x).

## Adaptation policy

Treat the patterns in this skill as canonical starting points, not an exhaustive list. The examples are meant to illustrate the core patterns.

When applying this skill to a codebase:

- Prefer the simplest migration pattern that preserves behavior.
- First try to map the local code to an equivalent of the patterns in this skill.
- Do not require an exact matching example in the skill before proceeding.
- If the local code differs in structure, infer the closest equivalent pattern and adapt it.
- Keep changes minimal and upgrade only the affected code.

## Scope rule

Do not treat the absence of an explicit example in this skill as a blocker. Use the guidance here to derive the appropriate migration for the local code.

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

Load exactly one reference file unless explicitly comparing versions.
