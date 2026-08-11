# Android premium-feel checklist (ralph loop working doc)

Task: optimise foam for Android so the experience feels premium. Sources: repo audit,
two Android client benchmarking passes, official Expo + Play Store guidance.

Status legend: [ ] todo · [~] in progress · [x] done · [-] rejected/not applicable

## Iteration log

- **Iter 1-2 (2026-07-20)**: Baseline verified - tsc green on working tree; jest + lint running.
  Working tree already contains coherent release-prep work (SystemBars edge-to-edge migration,
  Android memory-pressure tuning in cache-service, package rename to com.lhowsam.foam_tv,
  PlayerBackButton dedup, changelog presenter re-entrancy fix). 4 research agents launched
  (foam gap audit, benchmarking pass 1, benchmarking pass 2, Expo/Play Store
  guidance) - results pending.
- **Iter 3-4**: jest green (309 suites / 9758 tests). Baseline confirmed. Lint pending.
- **Iter 5+**: eslint green. Full baseline green (tsc + jest + lint) on the uncommitted
  working tree. Benchmarking and Expo/Play Store research captured below. foam
  code audit pending - it decides implementation order.
- **Iter 6 (implementation)**: Items 1, 2, 5, 6, 9 DONE (see checkboxes). Gates green
  after changes (tsc, jest near changed files, eslint on changed files). All uncommitted -
  intentionally not committing without user ask. NEXT UP: #4 Android sheet tonal
  surfaces, #8 EmoteBadgeViewer inset check, #3 Material You breadth decision, then
  from benchmarking: true-black pref, keyboard-height emote sheet verification.
- **Iter 7**: Items 3, 4, 8 DONE (see checkboxes). Gates green (tsc, eslint, jest on
  affected suites). Audit queue fully cleared except #7 (allowBackup - optional
  posture call, leaving). REMAINING IDEAS (not yet done): keyboard-height
  emote sheet verification (needs device), swipe-down-to-PiP + auto-PiP (PiP currently
  DISABLED - build-108 crash memory), tablet split layout, per-app language
  supportedLocales, notification channels (no push yet). Most need a device or are
  feature-scale - flagging for user rather than looping further.

## Findings & work items

### foam code audit - ranked gaps (the implementation queue)

Already solid (verified, do NOT redo): edge-to-edge (gradle + SystemBars + adjustResize),
predictiveBackGestureEnabled: true, monochrome adaptive icon, cross-platform haptics
(src/lib/haptics.ts), android_ripple on PressableArea/Button (zero TouchableOpacity),
Compose ModalBottomSheet action menu, keyboard-controller, native bottom tabs with
Material icons, Montserrat registered natively, no push notifications (channel config moot),
native default stack animations.

- [x] **1 [HIGH/low]** blockedPermissions DONE: android.blockedPermissions strips
      RECORD_AUDIO, SYSTEM_ALERT_WINDOW, ACCESS_MEDIA_LOCATION;
      isAccessMediaLocationEnabled: false; granularPermissions ['photo'] (MediaLibrary
      only saves images - saveFilesToAppAlbum.ts; clip download was removed in #749).
- [x] **2 [MED-HIGH/low]** Splash DONE: installed expo-splash-screen ~57.0.4 (was NOT
      installed - top-level splash key was silently ignored, hence stale white
      splashscreen_background). Plugin configured: image, imageWidth 200, bg #000000 +
      identical dark block. NATIVE change - needs prebuild/rebuild, no OTA.
- [-] **3 [MED/med]** Material You extension REVERSED per user directive (iter 9):
      Android must match iOS colors. All dynamic tint removed; fixed brand palette
      everywhere. See "Color direction: SUPERSEDED" section.
- [x] **4 [MED/low-med]** Sheet surfaces DONE: BottomSheetSurface Android/web branch
      surfaceSunken(#070A0E, darker than canvas - read as sunken) -> surfaceElevated
      (#1B232E) per Material dark tonal elevation; white-alpha row overlays compose fine.
      EmoteSheet near-black menu palette KEPT - it already steps tonally
      (#0A0A0B->header->card), same pattern as the AMOLED containers benchmarking
      turned up.
- [x] **5 [LOW-MED/low]** RefreshControl DONE: colors=[theme.colorPrimary]
      (dynamic color later removed per iOS-match rule) + progressBackgroundColor
      backgroundSecondary.dark.
- [x] **6 [LOW/low]** drawDistance DONE: unified to 500 on both platforms in
      FollowingScreen + CategoryScreen (Platform import removed).
- [ ] **7 [LOW]** allowBackup=true - mitigated by backup rules; optional stricter posture.
- [x] **8 [LOW]** EmoteBadgeViewerScreen inset VERIFIED NON-ISSUE: screen lives in the
      settings stack where Android gets a solid (non-transparent) header, so content
      starts below it naturally; the iOS-only padding compensates for iOS
      headerTransparent. Correct as written.
- [x] **9 [extra]** Haptics DONE: src/lib/haptics.ts now routes Android through
      performAndroidHapticsAsync (light=Virtual_Key, medium=Context_Click,
      heavy=Long_Press, selection=Segment_Tick); iOS keeps impactAsync/selectionAsync.

### From benchmarking pass 1

Top patterns worth stealing, ranked:

1. **Jump-free keyboard <-> emote-picker swap**: it persists measured IME height and
   opens the emote menu at exactly that height; gates bottom-sheet opens until IME fully
   dismissed. foam already uses react-native-keyboard-controller - verify emote sheet height
   matches persisted keyboard height (MMKV) and no flicker on toggle.
2. **AMOLED/true-black theme done right**: not pure-black-everything - surface=black but
   surfaceContainer* step up (#0A0A0A..#1C1C1E) so elevation stays legible on OLED.
   Candidate: foam "true dark" appearance preference.
3. **Monochrome themed launcher icon** (`<monochrome>` layer in mipmap-anydpi-v26) - Material
   You themed icons on Android 13+. Expo: `android.adaptiveIcon.monochromeImage`.
4. **Predictive back**: manifest `enableOnBackInvokedCallback=true` + progress-driven
   PredictiveBackHandler on emote menu (guarded against IME gesture). Expo:
   `android.predictiveBackGestureEnabled`.
5. **Long-press -> Material bottom sheet** (not dialog) with ripple + combinedClickable on
   chat rows. foam: verify chat long-press menu is a sheet on Android + rows have ripple.
6. **Edge-to-edge fully**: transparent bars + `isNavigationBarContrastEnforced=false` +
   per-component insets (input row navigationBarsPadding, cutout-only horizontal padding).
7. **Haptics**: none there - foam can beat it with expo-haptics on long-press/send.
8. **Notification channels**: silent low-importance channel for connection/foreground,
   default channel for mentions, grouped notifications.
9. **Per-app language** (`generateLocaleConfig`), **PiP** with setAutoEnterEnabled,
   **tablet split layout** via window size class.
10. **User prefs that read premium**: true-dark toggle (enabled only when dark active),
    accent color + palette style, font-size slider, keep-screen-on.

### From benchmarking pass 2

1. **Tiered haptics taxonomy** - selectionClick for toggles/tab switch, lightImpact for
   taps/pull-refresh, mediumImpact for long-press/gesture commits, heavyImpact for
   destructive (reset). Fire on threshold-crossing during gestures, not continuously.
2. **Swipe-down-to-PiP** on the player with translate+scale feedback, spring-back,
   graduated haptics (medium on entering trigger zone, light on leaving, medium on
   commit, velocity threshold 600).
3. **Auto-PiP** wired to a "video visible" flag; availability cached once per session;
   Android cannot programmatically EXIT PiP. (foam memory: PiP currently disabled -
   PIP_ENABLED=false after build-108 crash.)
4. **Adaptive-by-default wrappers** - one AdaptiveRefreshControl/Spinner/Switch that
   branches internally, instead of Platform.OS at every call site. iOS gets no ripple
   (NoSplash), Android keeps Material ripple.
5. **Bottom-sheet focus fix** - unfocus text fields before open and after close so the
   keyboard doesn't pop back.
6. **True-black OLED dark scaffold** + user accent seed color.
7. **Player fullscreen**: immersive-sticky system UI mode, draw-behind-cutout
   (shortEdges), transparent status bar per-screen, forceDarkAllowed=false.
8. **Crash hygiene**: classify transient network/plugin/image errors non-fatal so they
   don't tank crash-free rate (Play vitals).
9. Gaps foam can beat: predictive back, monochrome themed icon, Android 12
   splash API, wallpaper dynamic color, push notifications - none of them ship there.

### From official Expo + Play Store guidance (2026)

Hard requirements:
- [ ] targetSdk 36 by Aug 31 2026 - Expo SDK 56 targets it already; verify no
      expo-build-properties override lowers it.
- [ ] 16 KB page sizes (in force since Nov 2025) - SDK 52+/NDK r27 aligned by default;
      verify third-party .so libs in Play Console App bundle explorer.
- [ ] Edge-to-edge mandatory at targetSdk 36 - `edgeToEdgeEnabled` key REMOVED in SDK 55+,
      always on. expo-status-bar backgroundColor/translucent are no-ops; use SystemBars
      from react-native-edge-to-edge (working tree already migrating to this).
- [ ] Large screens: at targetSdk 36, orientation locks/resizeableActivity=false are
      IGNORED on sw600dp+ - layouts must survive rotation/resize.
- [ ] Vitals: crash < 1.09% DAU, ANR < 0.47%, cold start < 5s (best <= 500ms TTID).

Premium-feel (Expo-supported):
- [ ] `android.adaptiveIcon.monochromeImage` - themed icon (config-only win).
- [ ] expo-splash-screen `dark` block - dark splash variant (config-only win).
- [ ] `android.predictiveBackGestureEnabled: true` - default false in SDK 56; classic
      expo-router Stack had a regression (expo/expo#39092); full support in experimental
      Stack v5. Test back nav thoroughly before enabling.
- [ ] Haptics: use `Haptics.performAndroidHapticsAsync(AndroidHaptics.X)` on Android
      (Confirm, Long_Press, Toggle_On/Off, Segment_Tick, Keyboard_Tap...) - NOT
      impactAsync (legacy Vibrator emulation, discouraged by Expo docs).
- [ ] Ripple on all touchables (android_ripple / RNGH BaseButton) - absence is the
      biggest "iOS port" tell.
- [ ] Dynamic color: SDK 56 has `useMaterialColors` hook; androidDynamicColors.ts is
      the right direction.
- [ ] Per-app language via expo-localization `supportedLocales` (generates
      locale_config.xml).
- [ ] Navigation: keep `animation: 'default'` on Android native stack (OS transition,
      predictive-back-compatible); avoid forcing iOS-style slides globally.

### Color direction: SUPERSEDED by user directive (iter 9)

User saw the Material You blue switches on-device and ruled: **Android components must
match iOS in terms of colors.** Dynamic/Material You color is OUT for foam. Final state:
- [x] DELETED src/styles/androidDynamicColors.ts + its test; zero references remain.
- [x] All former dynamic sinks use the fixed brand palette (identical to iOS):
      tab bar tintColor=colorWhite, nav theme primary=colorPrimary, spinners +
      RefreshControl colors=colorPrimary, settings icons=colorPrimary fallback.
- [x] Compose Switches pinned to iOS UISwitch colors via
      src/styles/composeSwitchColors.ts (iosMatchedSwitchColors: on=#30D158 green +
      white thumb, off=#39393D track + white thumb) in ToggleRow.android +
      SettingsSection.android.
- [x] Kept from Platano study: `android.allowBackup: false` (color-neutral hygiene).
- On-device verified (iter 9): chat prefs toggles show grey off-state and iOS-green
  on-state; segmented pickers neutral; tab tint white. No Material You blue anywhere.

### On-device verification (iter 8, Pixel emulator, agent-device)

- [x] Splash: pure black bg + centered logo (Android 12 API) - no white flash.
- [x] Permissions: RECORD_AUDIO + ACCESS_MEDIA_LOCATION gone from installed build;
      SYSTEM_ALERT_WINDOW confirmed debug-manifest-only (release clean).
- [x] Tab bar: Material You pill indicator, OS-native tint.
- [x] Settings: Compose sections + icon tints correct.
- [x] Pull-to-refresh: dynamic-tinted spinner on dark puck (was white default).
- [x] Chat settings sheet: elevated slate surface + Material You switch colors.
- [x] Full app flow healthy: boot -> Top feed -> live stream + chat all working.
- [x] (iter 15) Back navigation verified on Android 16 with
      enableOnBackInvokedCallback=true: system back pops pushed screens correctly
      (Chat prefs -> Settings). The predictive-back opt-in does not break RN back
      handling; the animation itself needs a hands-on gesture to observe.
- [-] Haptics/drawDistance: not visually verifiable on emulator; typechecked + tested.
- NOTE: allowBackup=false verified in regenerated manifest; installed build predates
  it (next build picks it up).

### Per-app language (iter 12): N/A

- [-] expo-localization supportedLocales / Android 13 App-languages: foam ships only
      src/i18n/locales/en.ts. A single-language localeConfig adds a pointless system
      menu entry. Revisit only when a second locale lands.

### Release-manifest verification (iter 11) - CRITICAL CATCH

- [x] `allowBackup: false` FAILED the release manifest merge: TAndroidLame (via
      react-native-compressor) declares allowBackup=true and the merger errors without
      tools:replace. Would have broken the next release build. Fixed with new config
      plugin src/plugins/withAndroidAllowBackupReplace.js (adds
      tools:replace="android:allowBackup" on <application>).
- [x] Gradle :app:processReleaseMainManifest now BUILD SUCCESSFUL; merged RELEASE
      manifest verified: 0 hits for RECORD_AUDIO/SYSTEM_ALERT_WINDOW/
      ACCESS_MEDIA_LOCATION, allowBackup="false".

### Lint hygiene (iter 10)

- [x] eslint OOM root-caused: it was linting stale `.claude/worktrees/agent-*` full repo
      copies. Added `.claude/**` to eslint.config.mjs ignores. Full lint now completes.
- [x] ChangelogAndroidHost.android.tsx: array-index keys -> stable
      `${version}-${item.title}` keys (same class of fix as commit 578f944b).
- [x] (iter 13) BottomSheet forwardRef x2 migrated to React 19 ref-as-prop (mechanical,
      no behavior change; 10 sheet suites / 37 tests pass, tsc clean).
- [x] (iter 14) BottomSheet.native + StreamPlayerPoster derived-state warnings resolved
      via file-scoped eslint exemptions (repo convention, like the useNativeState
      doctor.config overrides): both are intentional stay-mounted-through-exit-animation
      gates - "fixing" them would break the dismiss/fade-out animations.
- Remaining 3 warnings (0 errors): no-giant-component on ChatPreferenceNativeForm +
  SettingsIndexScreen. Real refactor debt, left visible on purpose - splitting them is
  churn with no user-facing Android impact; needs user opt-in.

## Verification gates (run every iteration before committing)

- `bun run tsc`
- `bun run test` (jest - NOT bare `bun test`, which uses bun's runner and fails)
- `bun run lint` (needs NODE_OPTIONS=--max-old-space-size=8192 on this machine)
