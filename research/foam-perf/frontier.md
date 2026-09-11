# Foam startup and steady-state performance frontier - 2026-09-11

Measured against `main` at `c61c61b5` with the harness in `scripts/perf/`.
Every number comes from `research/foam-perf/baseline.md`; raw captures live
in `research/foam-perf/runs/`.

Every number in this file is from the **Debug dev client** (bundle served by
Metro, development React, unoptimised native, dev launcher in front of the RN
host) unless the row says otherwise. Release numbers are labelled "not
measured - needs release build". Dev numbers are useful for ordering stages
and for before/after comparison on the same build; they are not user-facing
times.

Confounders to keep in mind when reading:

- Host load average was 100-120 on a 14-core M4 Pro during the afternoon
  captures (another agent's Xcode build plus browser processes). The morning
  cold-start and 10-minute chat captures ran at lower load.
- The Pixel_9 emulator spent the afternoon in a `Process system isn't
responding` loop under that load, so Android scroll and FPS were blocked.
- The simulator has host RAM. Memory levels are not device numbers; slopes are.

## 1. Baseline table per device

| Metric (dev client)                                                        |                              iPhone 16 sim, median |   iPhone 16 sim, p90 |                                          Pixel_9 emulator, median |                                    Pixel_9 emulator, p90 | Release                                                         |
| -------------------------------------------------------------------------- | -------------------------------------------------: | -------------------: | ----------------------------------------------------------------: | -------------------------------------------------------: | --------------------------------------------------------------- |
| Cold start -> first RN frame (`CONTENT_APPEARED`)                          |                                          13,180 ms |            14,985 ms |                                                         23,506 ms |                                                28,565 ms | not measured - needs release build                              |
| Cold start -> first screen data (`GET /helix/streams 200`)                 |                                          14,895 ms |            18,040 ms |                                                         30,103 ms |                                                34,438 ms | not measured - needs release build                              |
| Cold start -> splash / native window                                       |                     1,178 ms (`Window became key`) |             1,230 ms |                                2,614 ms (`am start -W` TotalTime) |                                                 4,601 ms | not measured - needs release build                              |
| JS bundle execution (`RUN_JS_BUNDLE_START` -> `END`)                       |                                             635 ms |             1,109 ms |                                                          1,452 ms |                                                 3,237 ms | not measured - needs release build                              |
| `runApplication` -> first RN frame                                         |                                           3,665 ms |             4,324 ms |                                                          8,164 ms | 6,197 ms (p90 of per-run deltas not computed; max 6,197) | not measured - needs release build                              |
| Warm start: foreground -> first JS work (5 cycles)                         |                                               2 ms |                 8 ms |                                       not measured (emulator ANR) |                                                        - | not measured                                                    |
| Warm start: requests on foreground                                         |                                1 (`helix/streams`) |                    1 |                                                      not measured |                                                        - | 1 + OTA `checkForUpdate` in production (`useOTAUpdates.ts:275`) |
| Live chat 10 min (xqc): process CPU %                                      |                                                 38 |                   67 |                                       73 (sum over 4 vCPU, 5 min) |                                                      169 | not measured                                                    |
| Live chat: memory                                                          |                  RSS 1,465 MB, +411 MB over 10 min |             2,037 MB |                                     PSS 1,116 MB, flat over 5 min |                                                 1,135 MB | not measured                                                    |
| Live chat: UI frames                                                       | not measured (no frame histogram on the simulator) |                    - |    23.95% janky, p50 17 ms, p90 53 ms, p95 89 ms (5 min, gfxinfo) |                                                        - | not measured                                                    |
| Chat JS fps, synthetic replay idle (dev-tools overlay)                     |                                                 59 |               p10 49 |                                                     blocked (ANR) |                                                        - | not measured                                                    |
| Chat JS fps / UI fps / UI jank, `raid` flood phase (suite)                 |                                29 / 49 / 3.3 per s |                    - |                                                     blocked (ANR) |                                                        - | not measured                                                    |
| Chat JS fps / UI fps / UI jank, `steady60` flood phase (suite)             |                                30 / 46 / 3.4 per s |                    - |                                                     blocked (ANR) |                                                        - | not measured                                                    |
| Live chat 5 min (Caedrel, 13:16-13:21, loaded host): CPU % / RSS / threads |                                82 / 1,104 MB / 168 | 225 / 2,059 MB / 181 |                                                     blocked (ANR) |                                                        - | not measured                                                    |
| Live chat 5 min (Caedrel): JS fps from `BenchFrameProbe`, 280 samples      |               46 (p10 29, 80% of seconds under 55) |                   60 |                                                     blocked (ANR) |                                                        - | not measured                                                    |
| Top list, 20 flings: process CPU % (3 runs)                                |                                 61 (medians 55-75) |               82-109 |                           blocked (ANR; one invalid capture kept) |                                                        - | not measured                                                    |
| Hermes bytecode in shipped IPA                                             | yes, `main.jsbundle` 7,955,984 bytes, bytecode v98 |                      | Hermes on (`hermesEnabled=true`), `enableBundleCompression=false` |                                                          | shipped                                                         |

## 2. Startup waterfall (iOS dev client, medians, ms after the launch command)

```
0        2000      4000      6000      8000      10000     12000     14000     16000
|---------|---------|---------|---------|---------|---------|---------|---------|
|=| process start (151)
|=======| pre-didFinishLaunching: dyld, +load, static init          151 ->   933  (782)
        |==| didFinishLaunching -> window key (Sentry native, Firebase) 933 -> 1,178 (245)
           |==================| dev launcher wait (DEV ONLY)       1,178 -> 4,769 (3,591)
                              |===============| RN host + Metro fetch (DEV ONLY) 4,769 -> 8,875 (4,106)
                                              |===| bundle execution (top-level modules) 8,875 -> 9,510 (635)
                                                  |==================| runApplication -> first RN frame  9,515 -> 13,180 (3,665)
                                                                     |=======| skeleton -> auth ready 13,180 -> 14,567 (1,387)
                                                                             |=| auth ready -> first data 14,567 -> 14,895 (328)
```

Android dev client, same shape, larger: splash 2,614; bundle execution
13,882 -> 15,334 (1,452); `runApplication` -> first frame 15,342 -> 23,506
(8,164); first frame -> data 23,506 -> 30,103 (6,597, auth chain on a slow
emulator).

Top 5 stages by time, after removing the two dev-only stages:

| #   | Stage                              | iOS dev |           Android dev | What runs (file:line)                                                                                                                                                                                                                                                                              | Release                            |
| --- | ---------------------------------- | ------: | --------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | `runApplication` -> first RN frame |   3,665 |                 8,164 | `RootLayoutShell` -> 17 providers (`Providers.tsx:112-130`) -> Expo Router `Stack` -> `index` skeleton. Includes `Font.loadAsync` effect, Remote Config `fetchAndActivate` from `ForceUpdateModal` (`RootLayoutNav.tsx:52`), `RouterEffects` (`RouterEffects.tsx:76-197`), dev-only Rozenite hooks | not measured - needs release build |
| 2   | skeleton -> auth ready             |   1,387 |                ~4,300 | `populateAuthState` (`AuthContext.tsx:517-575`): SecureStore reads then sequential network calls; the expired-token path in this profile ran refresh -> validate -> anon -> validate                                                                                                               | network-bound, similar in release  |
| 3   | pre-`didFinishLaunching`           |     782 | (inside splash 2,614) | dyld, 429 static pods, ~142 `+load` classes, 28.7 MB main binary (production IPA)                                                                                                                                                                                                                  | not measured - needs device        |
| 4   | bundle execution                   |     635 |                 1,452 | `index.js:37-59` (device-info + `Image.configureCache`), `_layout.tsx:1-26` (Sentry init, error handlers, Reanimated logger), `query-provider.tsx:75-118` module scope, `preferenceStore.ts:205-232` MMKV read + parse, `analytics.ts:12`, `useOnReconnect.ts:4`                                   | not measured - needs release build |
| 5   | auth ready -> first data           |     328 |                ~2,300 | `helix/streams` request and `zod` parse in `twitch-service.ts`                                                                                                                                                                                                                                     | network-bound                      |

Markers that do not exist yet (stages labelled "not measured" because of it):

- "first JS render -> Expo Router root": nothing marks when `RootLayoutNav`
  first renders. A `performance.mark('root_layout_render')` at the top of
  `src/components/RootLayout/RootLayoutNav.tsx` render body, and a matching
  one in `src/app/index.tsx` before the skeleton return, would split stage 1.
- "first paint -> interactive": no marker. `src/app/tabs/top/streams.tsx` (or
  the `TopStreamsScreen` list `onLoad`) is where a `performance.mark('top_interactive')`
  would go, logged through `logger` so the harness can pick it up.
- Android `reportFullyDrawn`: not called anywhere. A 10-line Expo module under
  `modules/` calling `currentActivity.reportFullyDrawn()` from the same place
  as the marker above would make `am start -W` report a real fully-drawn time.
- Native pre-main on device: needs `DYLD_PRINT_STATISTICS` on a device build;
  not possible on the simulator dev client.

## 3. Ranked optimisation frontier

Ranked by ceiling. Each item: what, evidence, expected gain, effort, risk
(including to `patches/` and `modules/`), how to verify. "hypothesis -
unmeasured" marks a gain that this session could not measure.

**High ceiling**

- **P1 - Persisted chat store: 20.6 MB JSON parsed synchronously on first chat open, whole-table re-serialised on every save.**
  Evidence: `obsPersist` MMKV file 64 MB allocated / 52.6 MB live on the iOS profile; `chat-store-v2` value 20.62 MB (14 channels, `channelCaches` 20.2 MB); ceiling `MAX_CACHED_CHANNELS = 20` x ~1.5 MB (`src/store/chat/types/constants.ts:163`). Read path `ObservablePersistMMKV.getTable` -> `getString` + `JSON.parse` (`node_modules/@legendapp/state/persist-plugins/mmkv.mjs:43-54`), runs when `chatStore.ts` executes (first chat open, `inlineRequires`). V8 parses the string in 45 ms median / 57.8 ms p90; Hermes-on-device: hypothesis - unmeasured, expected several times slower. Write path re-serialises the whole table per coalesced save (`mmkv.mjs:15-18, 60-68`), which is why the file reached 64 MB.
  Expected gain: first chat open faster by the parse time plus GC of a 20 MB object graph; steady-state saves stop stringifying up to 30 MB. Size of the win on device: hypothesis - unmeasured.
  Effort: medium. Split `channelCaches` into one MMKV key per channel and hydrate only the opened channel (the `chat-recent-messages` store already works that way), or cap per-channel cache bytes.
  Risk: `patches/@legendapp+state*.patch` coalesces saves per table and is deliberate (`AGENTS.md`); per-channel tables must keep that coalescing. No native module involved.
  Verify: `performance.now()` around `persistObservable(chatStore$.persisted)` logged once; first `foam://chat` open time on a release build; `obsPersist` file size after a session.

- **P2 - `runApplication` -> first RN frame is the largest JS block (3,665 ms dev iOS, 8,164 ms dev Android) and has no release number.**
  Evidence: waterfall stage 1. It contains the provider stack (17 providers, `Providers.tsx:112-130`), `KeyboardProvider preload`, `ShakeToReport` accelerometer subscription, `ForceUpdateModal` -> `useRemoteConfig` -> `setConfigSettings` + `setDefaults` + `fetchAndActivate` on first render (`useRemoteConfig.ts:45-55, :91`), `RouterEffects` with QuickActions `isSupported` + `setItems`, `Linking.getInitialURL`, `useClearExpiredStorageItems` (after interactions), and the dev-only Rozenite hooks that inflate the dev figure by an unknown amount.
  Expected gain: unknown until measured on release. hypothesis - unmeasured.
  Effort: half a day to instrument (two `performance.mark`s named in section 2), then per-item.
  Risk: none from measuring.
  Verify: release build on a device, `CONTENT_APPEARED` minus `RUN_JS_BUNDLE_END` from `expo-insights` log lines (the harness already reads them).

- **P3 - Sentry JS init on the boot path: 779 KB of bundle and six integrations before first paint.**
  Evidence: `@sentry/*` is 11.2% of the minified bundle (core 295, react-native 248, browser 101, browser-utils 49, feedback 48, react 38 KB). `initSentry()` runs at `_layout.tsx` top level (`src/lib/sentry.ts:97-150`) with `mobileReplayIntegration`, `attachScreenshot`, `attachViewHierarchy`, `appStartIntegration`, `reactNativeTracingIntegration`, `graphqlIntegration`, `enableLogs`. Native `RNSentrySDK.start()` runs first in `AppDelegate.swift:19`, so native crash capture does not depend on the JS init timing. Sentry was disabled in the dev captures (`EXPO_PUBLIC_ENABLE_SENTRY` unset), so its JS cost is **not** inside the 635 ms bundle-execution number.
  Expected gain: bundle-execution and first-render time on release: hypothesis - unmeasured. Bundle bytes: 48 KB (feedback) removable now if `Sentry.captureFeedback` moves to a lazy require at `feedback.tsx`.
  Effort: low for moving replay/feedback behind a `runAfterInteractions`; medium if `Sentry.init` itself moves after first paint (loses early JS error capture between bundle start and init - the `installGlobalErrorHandlers()` call would need to buffer).
  Risk: replay and app-start spans need init before the first screen to record it; keep `appStartIntegration` early and defer only replay, screenshot, view hierarchy and feedback. Sentry profiling stays off (deliberate, `project_sentry_envelope_oom_crash`).
  Verify: release build, `RUN_JS_BUNDLE_START` -> `END` and `CONTENT_APPEARED` before/after; Sentry still receives a test error thrown 100 ms after launch.

- **P4 - Android release start: no Baseline Profile, no `reportFullyDrawn`, 16 KB page alignment unchecked.**
  Evidence: `android/gradle.properties` and `app/build.gradle` have Hermes on, `enableBundleCompression=false` (bytecode stays uncompressed for mmap - already right), minify + `shrinkResources` on, `useLegacyPackaging=true` (native libs compressed in the APK, extracted at install; fine for load time). No `profileinstaller`, no `baselineprofile` plugin, no `reportFullyDrawn` call, no 16 KB flags anywhere. AGP is resolved from the RN Gradle plugin (8.x), where R8 full mode is the default.
  Expected gain: Baseline Profiles are documented by Google as 20-30% faster cold start for typical apps; for this app: hypothesis - unmeasured, and the JS side (bundle execution + first render) is unaffected, so the ceiling is the native/ART part of the 2.6 s splash stage only.
  Effort: medium (profileinstaller dependency, a generated profile from a macrobenchmark run, checked into `android/app/src/main/baseline-prof.txt`; `expo prebuild` must not drop it - a config plugin is needed because `android/` is generated).
  Risk: none to `patches/`; `modules/` untouched. 16 KB page check needs an AAB: `zipalign -c -P 16 -v 4 app.aab` on the next EAS artifact.
  Verify: `scripts/perf/cold-start-android.sh` with `FOAM_LAUNCH_MODE=launch` on a release build, `am start -W` TotalTime and `Displayed`, 5 runs.

**Medium ceiling**

- **P5 - iOS fonts load at runtime; Android embeds them natively.**
  Evidence: `RootLayoutShell.tsx:68` `Font.loadAsync` of 6 "critical" TTFs (1.4 MB: Instrument Serif x2, Montserrat 400/500 + italics) in an effect, then 10 more (`:89`) after interactions; the `expo-font` config plugin embeds the same families for Android (`app.config.ts:302-339`) but the iOS list only has Source Code Pro (`:297-301`). The load is not awaited, so text first paints with the fallback font and swaps when the file registers: visible font swap on iOS is hypothesis - unmeasured (needs a frame capture).
  Expected gain: removes a 1.4 MB read + `CTFontManagerRegisterFontsForURL` from the post-first-render window and any font swap. Milliseconds: hypothesis - unmeasured.
  Effort: quick win - add the families to the iOS `fonts` list of the `expo-font` plugin, drop the runtime `loadAsync` for those files. Needs a native rebuild.
  Risk: low; the font family names must match what `Font.loadAsync` registered (`fontFamily` strings in the theme).
  Verify: `log stream` for `CTFontManager` lines during boot before/after; screenshot at `CONTENT_APPEARED` + 100 ms shows the serif title.

- **P6 - Remote Config `fetchAndActivate` and Firebase Analytics run inside the first render.**
  Evidence: `ForceUpdateModal` (`RootLayoutNav.tsx:52`) calls `useRemoteConfig` on first render -> `setConfigSettings`, `setDefaults`, `fetchAndActivate` (network; response landed 1.6 s after `runApplication` in dev). `getAnalytics(getApp())` at `analytics.ts:12` module scope plus the `installations` side-effect import.
  Expected gain: moves one network round trip and the Firebase JS bridge calls out of the window between `runApplication` and first frame. Milliseconds on release: hypothesis - unmeasured.
  Effort: quick win - wrap the `useRemoteConfig` fetch in `InteractionManager.runAfterInteractions` and keep defaults synchronous; the force-update decision then lands after first paint instead of before it, which is what the modal already tolerates (it is a modal over the tab UI).
  Risk: low. A/B flags read at first render (`project_ab_testing_and_chat_sheet`) would see defaults for the first frame - check `useRemoteConfig` consumers on the Top screen.
  Verify: dev harness, `fetchAndActivate` log line moves after `CONTENT_APPEARED`; `runApplication` -> `CONTENT_APPEARED` before/after, 5 runs, must move by more than the noise band (section 7).

- **P7 - `zod` (363 KB) enters the pre-paint path through one quick-action href schema.**
  Evidence: `RouterEffects.tsx:31` defines a `zod` schema for the quick-action href; `twitch-service.ts` also uses `zod` for API response parsing, which runs at the first `helix/streams` response (after first paint). Node cold `require` of zod is 24.5 ms median (V8, directional only).
  Expected gain: `zod` executes after first paint instead of before it. It does not leave the bundle, because the first query needs it. A few tens of ms of dev-JS time; release: hypothesis - unmeasured.
  Effort: quick win - replace the one schema with a string check, or move the quick-action handling behind `runAfterInteractions`.
  Risk: none.
  Verify: dev harness, `RouterEffects` marker (`isAuthCallbackUrl`) relative to `runApplication`.

- **P8 - Chat memory slope on iOS: +411 MB RSS over 10 minutes of xqc.**
  Evidence: baseline section 3, first-fifth median 1,400 MB -> last-fifth 1,811 MB on the simulator. `index.js:46` sizes the `expo-image` memory cache at 12% of _total_ RAM, which on the simulator is host RAM, so the simulator never trims; `cache-service.ts` caps decoded emotes at 5% of RAM. On a device the caps are 96-384 MB and 128-600 MB. The repo notes say the simulator never reproduces the device eviction path (`project_blank_chat_rows_emote_ref_eviction`).
  Expected gain: none until a device shows the same slope. hypothesis - unmeasured on device.
  Effort: one 10-minute device run with `steady-state-ios.sh` pointed at a device build (the script reads the host process, so it needs the Instruments Allocations track or `footprint` on device instead - not scripted here).
  Risk: changing the cache caps interacts with the blank-row fixes (`ChatInlineImage` sync-on-mount) and the frame-sync patch in `patches/expo-image@57.0.3.patch`; do not touch the caps without the device slope.
  Verify: device RSS first-fifth vs last-fifth over 10 minutes, twice.

- **P9 - Android chat frame health: 23.95% janky frames, p95 89 ms (dev, emulator).**
  Evidence: baseline section 3, `gfxinfo` over 300 s, 11,370 frames. The `raid` suite phase on iOS shows UI jank 3.3 per second and JS fps 29 (dev, loaded host).
  Expected gain: this is the chat render frontier already ranked in `.claude/skills/foam-chat-performance-audit/SKILL.md` (F1 recycling off, F2 paint renderer, F3 `Text` per-span cost, F4 ingest churn, F5 7TV update stall, F6-F8). Nothing here re-ranks it; the numbers above are the current dev-build baseline to compare against.
  Effort and risk: per the skill's frontier.
  Verify: `steady-state-android.sh` histogram and `sample-perf-overlay-ios.sh` on the suite before/after each item.

- **P10 - Unused Reanimated layout-animation presets ship in the bundle.**
  Evidence: `react-native-reanimated` is 754 KB of the bundle, of which Zoom 25, Fade 20, Flip 20, Bounce 19, Rotate 19 KB are preset files; `src/` imports only `FadeInUp`, `FadeOutDown`, `FadeInDown`, `FadeOutUp`. Hermes has no tree shaking, so every preset the package's index re-exports is compiled into the `.hbc`.
  Expected gain: ~80 KB of bytecode (about 1% of 7.96 MB). Load time effect: hypothesis - unmeasured, small.
  Effort: low if a Metro `resolver.resolveRequest` alias points the preset re-exports at empty modules; but that edits `metro.config.js`, a config file.
  Risk: any library that imports a preset by name (`expo-router`? `sonner-native`?) would break; grep before aliasing.
  Verify: `.hbc` size from `expo export`.

**Low ceiling / for the record**

- **P11 - Dev-only routes ship in production.** 9 `dev-tools` routes (43 KB) plus `storybook.tsx` are in the production route tree. Expo Router's default `sync` import mode only executes a route module when it renders (`getRoutesCore.js:244`), so the cost is bundle bytes and route-tree entries, not boot execution. Gain ~50 KB bytecode; hypothesis - unmeasured. Guarding them with the same `EXPO_PUBLIC_APP_VARIANT` literal pattern as `BenchFrameProbe.gate.tsx` keeps the code but not the require.
- **P12 - Timers that never stop.** `query-provider.tsx:75-118` arms a 15 s `setInterval` reconcile and a 2 s connectivity poll at module scope and never clears them (background included). CPU cost not measured; a P4 trade-off unless a background-CPU capture shows it.
- **P13 - `expo-updates` opens its database on launch** even with `EXUpdatesCheckOnLaunch = NEVER` and `EXUpdatesLaunchWaitMs = 0`. Cost not measured; needs a device pre-main + `didFinishLaunching` trace.
- **P14 - AVIF decoder contexts: 176 `dav1d-worker` threads in a 10 s `sample` of the Caedrel chat.**
  Evidence: baseline 3c. `ps` reported 136-186 threads (median 168) against 40-64 in the morning xqc run; `sample` names 176 of them `dav1d-worker`, plus 30 `com.apple.coremedia.JVTlib` (software H.264, simulator only) and 17 `SDImageFramePool.fetchQueue` queues. AVIF goes through `SDWebImageAVIFCoder` -> `libavif/libdav1d` (`ios/Podfile.lock:232-234, 474-477`); `SDImageAVIFCoder.m:137` sets `decoder->maxThreads = 2`, which `codec_dav1d.c:64` passes to dav1d as `n_threads`. Two workers per decoder means roughly 80-90 decoder contexts were alive at once - one per animated AVIF emote being decoded. On device: hypothesis - unmeasured; thread count there is the first thing to read.
  Expected gain: fewer threads competing with the JS and UI threads during emote-heavy chat; the JS-fps floor (10% of seconds under 30 fps in this run) is the number to watch. Size: hypothesis - unmeasured.
  Effort: medium. The lever is decoder lifetime and concurrency (how many animated AVIF decoders `SDImageFramePool` keeps open for visible rows), not the 2-thread setting. That sits in `SDWebImage` / `SDWebImageAVIFCoder` pods under `expo-image`, so any change is a pod patch next to the deliberate `patches/expo-image@57.0.3.patch` frame-sync work.
  Risk: the frame-sync patch and the memory budgets (`project_expo_image_frame_sync_patch`: 24/96 MB) already bound frame memory; a decoder cap must not reintroduce the blank-row eviction bug (`project_blank_chat_rows_emote_ref_eviction`). No `modules/` impact.
  Verify: `ps -M` thread count and `sample` thread names on a device build in the same chat, before/after; JS fps floor from `img-bench.json`.

**Do not do (measurement shows the common advice does not apply here)**

| Advice                                                                         | Why not, with the number                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dedupe or throttle foreground refetches                                        | Warm start does 1 request (`helix/streams`) and 0 socket reconnects in 5 of 5 cycles; `refetchOnWindowFocus` is already `false` and `useRefetchOnForeground` has a 30 s floor.                                                             |
| Add a TanStack Query persister for an instant first screen                     | There is none today, so there is no hydration cost. A persister adds a parse before first paint; the first screen already shows a skeleton 1.4 s before data, and the data itself is a 328 ms request. Only with a measured device number. |
| Enable Hermes / ship bytecode                                                  | Already shipped: `main.jsbundle` in the IPA has the Hermes magic, bytecode v98; Android `hermesEnabled=true`.                                                                                                                              |
| Set `enableBundleCompression=false` on Android                                 | Already set.                                                                                                                                                                                                                               |
| Switch Expo Router to `lazy` import mode to speed up boot                      | Sync mode already defers route module execution to first render; `lazy` mode only changes bundling and needs Metro async chunks. No boot execution win to have.                                                                            |
| Lazy-require `@legendapp/list`, Skia, keyboard-controller for the first screen | `inlineRequires: true` (`metro.config.js:36`) already defers their execution to first use; they cost bytecode bytes, not boot time.                                                                                                        |
| Change `expo-image` prefetch policy to `memory-disk`                           | Must stay `disk` (`project_expo_image_prefetch_memory_poisoning`).                                                                                                                                                                         |
| Change the expo-image frame-sync patch or the legend-state patch               | Both are deliberate (`AGENTS.md`, `patches/`). P1 must work with the legend-state patch, not around it.                                                                                                                                    |
| Convert the hot chat `Map`s to observables                                     | Deliberate plain `Map`s with a revision counter (`AGENTS.md`, `project_chat_state_storage_principle`).                                                                                                                                     |
| Add `useMemo` / `React.memo` anywhere                                          | React Compiler is on; the skill forbids it without a bailout.                                                                                                                                                                              |
| Poll `CpuUsageModule` less                                                     | It is only mounted by `LiveChatPerfOverlay` / `ChatPerfScreen` under dev-tools; it does not run in production and does not poll while hidden because it is not mounted.                                                                    |
| Move `Image.configureCache` later                                              | It must run before the first image request (`index.js:37-59`); it is 1 native call.                                                                                                                                                        |
| Refactor `AuthContext` to parallelise `validateToken` + `getUserInfo`          | Auth code is off limits by repo rule (`feedback_dont_touch_auth_code`). The 1,387 ms skeleton stage is real, but the lever is design-side (section 6), not auth.                                                                           |

## 4. Quick wins vs structural

Quick wins (half a day or less, low risk):

1. P5 - embed the iOS fonts through the `expo-font` config plugin (needs a native rebuild, no code risk).
2. P6 - move Remote Config `fetchAndActivate` and analytics enable behind `runAfterInteractions`.
3. P7 - drop `zod` from `RouterEffects` (one schema).
4. Section 2 markers: two `performance.mark`s plus an Android `reportFullyDrawn` module so stage 1 can be split and release runs can be scripted.
5. P11 - gate `dev-tools` and `storybook` routes with the `EXPO_PUBLIC_APP_VARIANT` literal pattern.
6. `Sentry.captureFeedback` lazy require (48 KB) - the small half of P3.

Structural:

1. P1 - per-channel chat cache persistence.
2. P2 - measure and then cut the `runApplication` -> first frame block on release.
3. P3 - Sentry integration deferral.
4. P4 - Android Baseline Profile + 16 KB check.
5. P9 - the chat render frontier (F1-F8 in the chat audit skill).
6. P8 - device memory slope (measure first).

## 5. Harness

`scripts/perf/README.md` documents every script. Added or fixed in this session:

- `warm-start-ios.sh` - no longer aborts when `simctl launch` returns non-zero (app already frontmost); writes `cycle-N.js-lines.txt`.
- `scroll-top-ios.sh` - Top tab flings through `argent run gesture-swipe`, 1 s CPU/RSS sampling.
- `scroll-top-android.sh` - same with `input swipe`, `gfxinfo` histogram and PSS before/after.
- `sample-perf-overlay-ios.sh` - reads the `dev-tools/chat-perf` overlay (JS fps, UI fps, UI jank, CPU) from the accessibility tree.
- `img-bench.json` in the app's Documents directory holds one JS-fps sample per second for every chat session on a dev build (`BenchFrameProbe`, mounted by `Chat.tsx`); read it with the snippet in the README.

Blocked in this environment, with the unblock:

- CDP (`argent debugger-evaluate`, `react-profiler-*`, a direct `ws` client): Metro's inspector proxy accepts the socket (with an `Origin` header) and closes it 13 ms later with code 1006 before any message. Another client holds the page. Unblock: stop the other inspector client (Rozenite panel or another agent's argent session) and retry.
- Release builds: none installable without `expo prebuild` or a rebuild; the `.ipa` files are device builds. Unblock: an EAS simulator build (`eas build -p ios --profile <simulator profile>`) or a device with the production IPA.
- Android afternoon captures: `system_server` ANR loop under host load 100+. Unblock: idle host, or a physical device.
- xctrace on the simulator: known broken (records nothing); `sample` is the fallback and is what the harness uses.

## 6. Design-side findings for Plan A

Numbers are dev-client medians; the ordering and the shapes are what matter.

- **Splash hold vs skeleton.** Expo Router hides the splash on the first `NavigationContainer.onReady` (`renderRootComponent.js:86`, `global-state/store.js:93-99`); the app never calls `SplashScreen` itself. So the splash drops at the `index` route commit, which shows six `LiveStreamCardSkeleton`s, then `index` redirects to `/tabs/top` or `/tabs/following` (`src/app/index.tsx:22-53`). First frame -> auth ready 1,387 ms, -> first data 1,715 ms (iOS dev). Design choice to make: either hold the splash until the redirect target commits (one fewer visible transition, longer splash) or keep the skeleton and make it the exact geometry of `LiveStreamCard` including the tab bar, so the redirect does not re-layout. Which is better perceived: hypothesis - unmeasured; a screen recording of both is the test.
- **The skeleton screen has no tab bar and no header**, while the target screen has both, so the redirect is a full-layout change ~1.4 s after first paint. A progressive reveal that renders the Top tab shell immediately for anonymous users (the `ONBOARDING_SEEN_KEY` and the last known auth state are both in MMKV before `ready`) would remove that layout jump without touching auth code. hypothesis - unmeasured.
- **iOS fonts may swap after first paint** (P5). If Plan A adds display type (Instrument Serif titles), embed the files natively so the first frame already has them.
- **Top list.** `FlashList` with `drawDistance={500}` and one item type (`TopStreamsScreen.tsx:129-136`). 20 flings cost 61% of one core (dev) and RSS climbs with every decoded thumbnail on the simulator. Thumbnail size and count per row are the design levers: a larger card means fewer decodes per screen; a blurhash or solid placeholder avoids the white flash while `expo-image` decodes.
- **Chat rows.** `raid` flood: UI jank 3.3 per second, JS fps 29 (dev, loaded host). Every added per-row element (badges, paints, reply lines, timestamps) sits on that path; `chatTimestamps` defaults off for that reason (`project_ab_testing_and_chat_sheet`). Chat row typography must come from `getChatScale` / `getChatTextStyles` (`AGENTS.md`).
- **Warm start is clean** (1 request, ~2 ms to first JS work). No loading state is needed on foreground; do not add a spinner or a re-skeleton on resume.
- **Sheets** stay on `@expo/ui` bottom sheets with the iOS touch patch; the emote grid depends on it (`AGENTS.md`).

## 7. Noise

Noise for this harness is the p90 minus the median across the runs of one
metric on one device and build. From this session:

| Metric                                                |    Median |         p90 |   Noise (p90 - median) |
| ----------------------------------------------------- | --------: | ----------: | ---------------------: |
| iOS cold start -> first RN frame (5 runs)             | 13,180 ms |   14,985 ms |        +1,805 ms (14%) |
| Android cold start -> first RN frame (5 runs)         | 23,506 ms |   28,565 ms |        +5,059 ms (22%) |
| iOS live chat CPU % (10 min, 120 samples)             |        38 |          67 |             +29 points |
| Android live chat CPU % (5 min, 60 samples)           |        73 |         169 |             +96 points |
| iOS Top scroll CPU % (3 runs, medians 55/61/75)       |        61 |          75 |             +14 points |
| iOS warm start foreground -> first JS work (5 cycles) |      2 ms |        8 ms |                  +6 ms |
| iOS JS fps, synthetic replay idle (12 samples)        |        59 | 60 (p10 49) |  1 fps up, 10 fps down |
| iOS JS fps, live Caedrel chat (280 samples)           |        46 | 60 (p10 29) | 14 fps up, 17 fps down |

A change measured with this harness counts only if it moves the median by
more than that band on the same device and build, with at least 5 runs. The
afternoon captures ran under host load 100-120, so their bands are wider than
the morning ones; re-run on an idle host before treating a sub-10% change as
real.
