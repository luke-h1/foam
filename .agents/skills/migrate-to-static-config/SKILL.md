---
name: migrate-to-static-config
description: Migrate React Navigation 7.x or 8.x navigators from JSX-based Dynamic API Navigator and Screen elements to Static API object configuration. Use when converting React Navigation screen trees, static navigation containers, nested navigators, groups, linking/deep-link config, render callbacks, getComponent screens, custom navigators, or static/dynamic API boundaries while preserving behavior and TypeScript types.
---

# Migrating to Static Config

## Goal

Convert React Navigation navigators from JSX-based dynamic setup to static configuration while preserving behavior, typing, and deep links.

## When to use

You are migrating screens from Dynamic API to the Static API in React Navigation.

## Adaptation policy

Treat the patterns in this skill as canonical starting points, not an exhaustive list. The absence of an exact matching example is not a blocker.

- Map local code to the closest pattern here and adapt it; infer an equivalent when the structure differs.
- Prefer the simplest migration that preserves behavior.
- Keep changes minimal and local, matching the existing code style and React Navigation's intended static API.
- Avoid bespoke abstractions unless the simpler patterns clearly cannot preserve behavior.

## Decision rule

Use this order of preference:

1. Direct static config conversion.
2. Static config plus `.with()` for navigator-level wrappers or dynamic navigator props.
3. Static config plus context for extra screen data that was previously passed through render callbacks.
4. Keep the navigator dynamic only if static config cannot express the screen structure without changing behavior materially.

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

Static config is not supported in versions prior to 7.x.

Load the main reference file for the matching version. The main reference points to companion files (custom navigators, render callbacks, `getComponent`, mixing APIs) — load each only when the matching pattern is present in the codebase being migrated.

## Verification

After editing code:

- Determine the package manager from `package.json` or the lockfile.
- Run the existing type checker, linter, and relevant tests when scripts are available.
- If a verification step cannot run, report why and do a manual review against the checklist in the loaded reference.
