---
name: migrate-to-static-config
description: Migrate React Navigation navigators from dynamic component based config to static object based config.
---

# Migrating to Static Config

## Goal

Convert React Navigation navigators from JSX-based dynamic setup to static configuration while preserving behavior, typing, and deep links.

## When to use

You are migrating screens from Dynamic API to the Static API in React Navigation.

## Adaptation policy

Treat the patterns in this skill as canonical starting points, not an exhaustive list. The examples are meant to illustrate the core patterns.

When applying this skill to a codebase:

- Prefer the simplest migration pattern that preserves behavior.
- First try to map the local code to an equivalent of the patterns in this skill.
- Do not require an exact matching example in the skill before proceeding.
- If the local code differs in structure, infer the closest equivalent pattern and adapt it.
- Avoid inventing bespoke abstractions unless the simpler patterns clearly cannot preserve existing behavior.
- Keep changes minimal and local to the migration.
- If multiple approaches are possible, choose the one closest to the existing code style and React Navigation's intended static API.

## Decision rule

Use this order of preference:

1. Direct static config conversion.
2. Static config plus `.with()` for navigator-level wrappers or dynamic navigator props.
3. Static config plus context for extra screen data that was previously passed through render callbacks.
4. Keep the navigator dynamic only if static config cannot express the screen structure without changing behavior materially.

## Scope rule

Do not treat the absence of an explicit example in this skill as a blocker. Use the guidance here to derive the appropriate migration for the local code.

## When to ask for clarification

Inspect the local code first.

If, after reading the relevant navigator and its immediate callers, you cannot explain how the final screen structure, linking behavior, and preserved behavior map to the static API with high confidence, pause and ask the user before editing code.

Ask for clarification when:

- Part of the behavior is hidden behind local abstractions.
- Migrating would require assumptions about which behavior is intentional.
- It is unclear whether related helpers should be updated as part of the same change.

## References

Check `@react-navigation/native` in `package.json` first.

- If `7.x`, read [`references/react-navigation-7.md`](./references/react-navigation-7.md)
- If `8.x`, read [`references/react-navigation-8.md`](./references/react-navigation-8.md)

Load exactly one reference file unless explicitly comparing versions.
