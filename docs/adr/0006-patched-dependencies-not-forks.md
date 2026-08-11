# Carry dependency fixes as patches/, not forks or replacements

Six packages ship patched via bun `patchedDependencies`:

- `expo-image@57.0.1` - emote frame sync + decode budgets (iOS; landed on
  main in #857).
- `@legendapp/state@2.1.15` - diff-path rewrite, -86% per `messages.set`
  (see `PERF_REPORT.md`), plus persist coalescing.
- `@legendapp/list@3.3.3` - chat-list fixes on the v3 line.
- `@expo/ui@57.0.8` - carries the still-open upstream touch fix
  expo/expo#48259 (hosted `Pressable` drops `onPress` on finger movement).
- `react-native-screens@4.26.2` - touch-handling fixes.
- `@sentry/core@10.57.0`.

We patch rather than fork or replace:

- A patch file is a visible, reviewable diff against a pinned version; a fork
  is an invisible delta that must be rebased on every upgrade and hides from
  `bun outdated`.
- Several patches are upstream PRs in flight (`@expo/ui`) or version-line
  backports (`@legendapp/state` v2 is superseded by a breaking v3); both are
  temporary states a fork would make permanent.
- Replacement was evaluated and rejected where it mattered most: expo-image is
  the sole emote/badge renderer precisely because the Nitro renderer's removal
  was itself a perf win.

**The patched surface is off-limits by default.** A change that would edit
patched behaviour needs a candidate strong enough to reopen this ADR, and each
patch is dropped the release after upstream ships its fix.

## Consequences

Every `bun install` depends on the patch applying cleanly, so version bumps of
patched packages are deliberate events, not routine upgrades (several are also
SDK-pinned). The patch files are load-bearing and reviewed like source.
