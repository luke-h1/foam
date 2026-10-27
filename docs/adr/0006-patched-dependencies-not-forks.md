# Carry dependency fixes as patches/, not forks or replacements

Five packages ship patched via bun `patchedDependencies`:

- `expo-image@58.0.17` - emote frame sync + decode budgets (iOS driver landed on
  main in #857) plus the Android phase lock and the `FrameAnimationDrawable`
  pause/resume fix (ADR-0009). The same patch stops a remote image over 5 MB
  from failing to decode (expo/expo#51833): APNG4Android's unbounded animation
  checks are off, and a bounded reader still finds animated WebP, APNG and
  AVIF. The Android half only compiles because `^expo-image$` is in
  `expo.autolinking.android.buildFromSource`.
- `@legendapp/state@2.1.15` - diff-path rewrite, -86% per `messages.set`
  (see `PERF_REPORT.md`), plus persist coalescing.
- `@legendapp/list@3.3.3` - chat-list fixes on the v3 line.
- `@expo/ui@58.0.23` - Android `SegmentedButton` `icon = {}` so the checkmark
  does not push the label off centre. iOS touch routing is upstream in SDK 58;
  track expo/expo#48259 if taps regress.
- `react-native-screens@4.30.0` - iOS only. A form sheet opened while another
  sheet on the same stack is still closing is retried when the dismissal ends
  (expo/expo#51740). SF Symbol tab icons lay out again after a stack screen
  (expo/expo#42364). The SDK 58 touch-handling patch stays dropped.

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

Dropped on the SDK 58 upgrade:

- `@sentry/core@10.57.0` - console double-instrument fix is upstream.
- `react-native-screens@4.26.2` - touch-handling fixes are upstream in 4.30.

## Consequences

Every `bun install` depends on the patch applying cleanly, so version bumps of
patched packages are deliberate events, not routine upgrades (several are also
SDK-pinned). The patch files are load-bearing and reviewed like source.
