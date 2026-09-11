# Foam startup and steady-state baseline - 2026-09-11

Measured against `main` at `c61c61b5`. Every number below was produced by the
scripts in `scripts/perf/` (see `scripts/perf/README.md`); raw captures and
`summary.json` files are in `research/foam-perf/runs/`.

## Read this first: what was and was not measurable

| Want                                             | Got                                                                                                                                                          | Why                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release cold start on a device                   | **not measured - needs release build**                                                                                                                       | `build-artifacts/*.ipa` are device (arm64) builds and cannot run on a simulator. A local Release simulator `xcodebuild` crashes (prior session) and would write into `ios/`, which this session may not touch.                                                                                                                            |
| Cold start of _some_ build, 5 runs, median + p90 | Yes - Debug dev client on iPhone 16 simulator and on the Pixel_9 emulator, bundle served by Metro                                                            | Only installable build available without touching the tree.                                                                                                                                                                                                                                                                               |
| Exact stage boundaries                           | Yes, from log markers the app already emits                                                                                                                  | `expo-insights` logs the epoch of `PROCESS_START`, `RUN_JS_BUNDLE_START/END`, `APP_STARTUP_END`, `CONTENT_APPEARED`; `RCTMultipartDataTask`, `Window became key`, `[FirebaseCore]` and the app `logger` lines fill the rest. No `src/` edits were needed.                                                                                 |
| Hermes bytecode shipping                         | Confirmed                                                                                                                                                    | `main.jsbundle` in `app-production.ipa` starts with the Hermes magic `c6 1f bc 03 c1 03 19 1f`, bytecode version 98, 7,955,984 bytes.                                                                                                                                                                                                     |
| Warm start work                                  | Yes, 2 cycles on iOS dev client                                                                                                                              | Third cycle aborted (`simctl launch` returned non-zero); two cycles were enough to count what fires.                                                                                                                                                                                                                                      |
| Chat steady state                                | Yes - 10 min iOS sim, 5 min Android emulator, live `xqc`                                                                                                     | Dev builds, so absolute CPU is inflated. Growth curves and frame histograms are still informative.                                                                                                                                                                                                                                        |
| JS/UI FPS on iOS                                 | Yes (afternoon re-run) - JS fps from `BenchFrameProbe` (`img-bench.json`) and JS/UI fps + UI jank from the `dev-tools/chat-perf` overlay, sections 3a and 3c | Dev-build instrumentation the app already ships; no code change. Android `gfxinfo` gives the UI side there.                                                                                                                                                                                                                               |
| Which modules execute at boot                    | Partial - static inventory with file:line below                                                                                                              | The Hermes inspector rejected a scripted CDP session (socket closed 1006 on the first message), so `__r.getModules()` and the rozenite require-profiler chains could not be dumped. The require profiler _is_ active in the dev bundle (`.env` sets `EXPO_PUBLIC_WITH_ROZENITE=true`); the Rozenite UI can show the chains interactively. |
| Pre-main (dyld) on device                        | **not measured - needs device**                                                                                                                              | Proxies from the production binary are listed instead.                                                                                                                                                                                                                                                                                    |

Hardware: host Apple M4 Pro, 14 cores, 48 GB. iPhone 16 simulator
`AA1A3696-8F85-4AE2-96CA-1E5C69018B1C` (booted by this session). Pixel_9
emulator, API 36, 4 vCPU, 2.5 GB RAM. The main agent's iPhone 17 Pro
simulator was not touched.

Builds used:

- iOS: `Foamdev.app` Debug simulator dev client from DerivedData (built 31 Aug,
  `foam-tv-dev`, version 1.0.9), JS from Metro at `localhost:8081` (`main`
  HEAD). Metro is shared with the main agent; the iOS bundle was already
  cached, the Android bundle was built once before the timed runs.
- Android: `com.lhowsam.foam.dev` already on the emulator (native 1.0.6, built
  11 Aug, Debug), JS from the same Metro. Native is two minor versions behind
  the JS; the app ran without a red box, one `DevLauncher`
  `NoSuchFieldException: colorScheme` warning was logged.

## 1. Cold start

All values are milliseconds after the launch command, median / p90 over 5
runs. "Cold" means the process was terminated first; the OS page cache was
warm.

### iOS - Debug dev client, iPhone 16 simulator

| Stage (marker)                                                        | median |    p90 |    min |    max |
| --------------------------------------------------------------------- | -----: | -----: | -----: | -----: |
| Process start (`Insights: PROCESS_START`)                             |    151 |    154 |    140 |    154 |
| `didFinishLaunching` running (`[FirebaseCore]` configure log)         |    933 |    954 |    921 |    954 |
| Native window key (`Window became key`)                               |  1,178 |  1,230 |  1,175 |  1,230 |
| Expo modules registering (RN host init; dev launcher wait before it)  |  4,769 |  6,168 |  4,629 |  6,168 |
| Bundle requested from Metro (`RCTMultipartDataTask GET`)              |  7,802 |  8,933 |  6,295 |  8,933 |
| JS bundle execution starts (`RUN_JS_BUNDLE_START`)                    |  8,875 |  9,542 |  6,897 |  9,542 |
| Entry point finished (`RUN_JS_BUNDLE_END` = `APP_STARTUP_END`)        |  9,510 | 10,651 |  7,762 | 10,651 |
| `AppRegistry.runApplication` (`Running "main"`)                       |  9,515 | 10,661 |  7,769 | 10,661 |
| `RouterEffects` effect ran (`isAuthCallbackUrl`, root layout mounted) | 12,990 | 14,751 | 11,380 | 14,751 |
| First RN frame (`CONTENT_APPEARED` = index-route skeleton)            | 13,180 | 14,985 | 11,580 | 14,985 |
| Auth ready (`twitch token validated`)                                 | 14,567 | 17,312 | 13,056 | 17,312 |
| First screen query sent (`helix/streams`)                             | 14,608 | 17,408 | 13,105 | 17,408 |
| First screen data back (`GET /helix/streams 200`)                     | 14,895 | 18,040 | 13,499 | 18,040 |

Per-stage durations that survive into release (dev-inflated, but the
ordering is the point):

- pre-`didFinishLaunching`: ~780 ms (151 -> 933). Debug binary, 429 pods.
- `didFinishLaunching` -> window key: ~245 ms.
- Bundle execution (entry point, all top-level module code that runs
  eagerly): 635 ms median (8,875 -> 9,510).
- `runApplication` -> first RN frame: **3,665 ms** (9,515 -> 13,180). This is
  the React root render of `RootLayoutShell` -> `Providers` -> Expo Router
  `Stack` -> `index` route in development mode with the dev-tools hooks
  mounted. In release the same work is far smaller, but it is the largest JS
  block in the dev waterfall and the one to re-measure first on a release
  build.
- First frame -> auth ready: 1,387 ms (13,180 -> 14,567). Network: stored
  user token was expired in this profile, so the chain was refresh attempt ->
  validate -> fetch anon -> validate. A logged-in user with a valid token pays
  `validateToken` + `getUserInfo` sequentially before `ready` (`AuthContext.tsx:336`, `:352`).
- Auth ready -> first screen data: 328 ms.

Dev-only stages, excluded from any release estimate: window key -> Expo
modules registering (3.6 s, the dev launcher's manifest fetch and Bonjour
browse) and the Metro fetch (bundle request -> `RUN_JS_BUNDLE_START`, 1.1 s).

### Android - Debug dev client, Pixel_9 emulator (API 36)

| Stage (marker)                                                 | median |    p90 |    min |    max |
| -------------------------------------------------------------- | -----: | -----: | -----: | -----: |
| `am start -W` TotalTime (first frame of MainActivity = splash) |  2,614 |  4,601 |  1,373 |  4,601 |
| `Displayed` (ActivityTaskManager)                              |  2,669 |  4,696 |  1,409 |  4,696 |
| JS bundle execution starts                                     | 13,882 | 19,127 | 12,325 | 19,127 |
| Entry point finished                                           | 15,334 | 22,364 | 14,316 | 22,364 |
| `runApplication`                                               | 15,342 | 22,368 | 14,320 | 22,368 |
| First RN frame (`CONTENT_APPEARED`)                            | 23,506 | 28,565 | 21,097 | 28,565 |
| `RouterEffects` ran                                            | 23,663 | 28,712 | 21,259 | 28,712 |
| First screen query sent                                        | 26,910 | 32,652 | 23,973 | 32,652 |
| Auth ready                                                     | 27,826 | 32,903 | 24,755 | 32,903 |
| First screen data back                                         | 30,103 | 34,438 | 25,036 | 34,438 |

Bundle execution 1,452 ms; `runApplication` -> first frame **8,164 ms** on a
4-vCPU emulator in development mode. Time to splash (2.6 s) is the only stage
here that is comparable to a release number, and even that is a Debug native
build on an emulator.

### Noise (from these runs)

p90 minus median, cold start "first RN frame": iOS +1,805 ms (14% of median),
Android +5,059 ms (22%). p90 minus median for steady-state CPU: iOS +29
points, Android +96 points. A design or code PR measured with this harness
needs to move a stage by more than that spread on the same device and build
before it counts. Run at least 5 runs and compare medians.

## 2. Warm (resumed) start - iOS dev client, 2 cycles

Backgrounded by opening Safari for 15 s, foregrounded with `simctl launch`,
15 s window observed. The app was on the chat screen (left there by the
steady-state run).

| Cycle |                                                JS log lines |                                                     HTTP requests | Socket revive / reconnect | OTA check | Remote Config fetch |
| ----- | ----------------------------------------------------------: | ----------------------------------------------------------------: | ------------------------: | --------: | ------------------: |
| 1     |                                                           6 | 1 (`helix/streams`, the stream screen's `useRefetchOnForeground`) |                         0 |         0 |                   0 |
| 2     | 17 (IRC PING/PONG, 7TV entitlement events, emote fallbacks) |                                                                 0 |                         0 |         0 |                   0 |

There is no foreground refetch storm. `refetchOnWindowFocus` is `false`
(`src/lib/react-query/query-client.ts:82`), `useRefetchOnForeground` has a
30 s floor (`src/hooks/useRefetchOnForeground.ts:22`), sockets only reconnect
when `readyState === CLOSED` (`useSeventvWs.ts:783`,
`twitch-ws-service.ts:719`), and the OTA foreground check is gated by
`MINIMUM_MINIMIZE_TIME` outside production (`useOTAUpdates.ts:274`). In
production the OTA `checkForUpdate` request fires on every foreground
(`isProduction ||` at `useOTAUpdates.ts:275`) - one small request, not a
storm. `refetchOnReconnect: true` will refetch every active query when
`expo-network` flips connectivity; not exercised here.

### Re-run: 5 cycles, 13:05-13:08, app on the Top tab (logged out)

Script fixed (`simctl launch` returns non-zero when the app is already
frontmost; the script now ignores that). Host load average was 118 on 14
cores during this run (another agent's Xcode build plus browser processes),
so absolute times are inflated; the counts are not affected.

| Cycle | JS log lines in 15 s |       HTTP requests | Socket revive / reconnect | OTA check | Remote Config fetch | `ApplicationDidBecomeActive` -> refetch request |
| ----- | -------------------: | ------------------: | ------------------------: | --------: | ------------------: | ----------------------------------------------: |
| 1     |                    2 | 1 (`helix/streams`) |                         0 |         0 |                   0 |                                            8 ms |
| 2     |                    2 |                   1 |                         0 |         0 |                   0 |                                            1 ms |
| 3     |                    2 |                   1 |                         0 |         0 |                   0 |                                            2 ms |
| 4     |                    2 |                   1 |                         0 |         0 |                   0 |                                            2 ms |
| 5     |                    2 |                   1 |                         0 |         0 |                   0 |                                            5 ms |

Median 2 ms, p90 8 ms from the foreground notification to the single
`useRefetchOnForeground` request. The response landed 0.3-1.0 s later
(network). No socket work happens on the Top tab because no chat socket is
open there. Raw logs: `runs/warm-start-ios/cycle-*.log`.

## 3. Steady state - live `xqc` chat

### iOS, Debug dev client, iPhone 16 simulator, 10 minutes, samples every 5 s

| Metric                                     | median |   p90 |   min |   max |
| ------------------------------------------ | -----: | ----: | ----: | ----: |
| Process CPU % (1 s delta of `cputime`)     |     38 |    67 |     9 |   135 |
| RSS MB (host memory - not a device number) |  1,465 | 2,037 | 1,250 | 2,118 |
| Threads                                    |     45 |    51 |    40 |    64 |

RSS first fifth median 1,400 MB -> last fifth median 1,811 MB (+411 MB over
10 min). The simulator has Mac RAM and no jetsam pressure, and the memory
notes for this repo already say the sim never reproduces the device
eviction path; treat the slope, not the level, as the signal.

`sample` (10 s, end of run) thread busy share: JS thread 62% busy, main
thread 29% busy, all `hades` GC threads 0% (idle in the sampled window).
Top-of-stack: `hermes::vm::Interpreter::interpretFunction` 792 samples, then
`vImage` transforms (emote decode) 216 + 47, `FunctionDebugInfoDeserializer`
97 (dev-bytecode debug info, not present in release).

### Android, Debug dev client, Pixel_9 emulator, 5 minutes, samples every 5 s

| Metric                          | median |   p90 |   min |   max |
| ------------------------------- | -----: | ----: | ----: | ----: |
| CPU % (`top`, sum over 4 vCPUs) |     73 |   169 |    36 |   257 |
| PSS MB                          |  1,116 | 1,135 | 1,087 | 1,155 |
| Java heap MB                    |     32 |    41 |    30 |    51 |
| Native heap MB                  |    351 |   363 |   346 |   407 |

No PSS growth over 5 minutes (1,087 -> 1,155 MB band).

`dumpsys gfxinfo` over the same 300 s: 11,370 frames rendered (38 frames/s
average, so the list was committing most of the time), **23.95% janky
frames**, p50 17 ms, p90 53 ms, p95 89 ms. Dev build on an emulator; the
histogram shape (long p95 tail) is the part worth re-checking on a device.

### Not measured

- List blank-cell rate (needs an on-device recording or the LegendList debug
  overlay).
- Player + chat together: the WebView player mounts, but CPU inside the
  WebKit processes is not attributed to the app process by `ps`; needs
  Instruments on device.
- `CpuUsageModule`: it is only read by `src/dev/imageBenchmark/useCpuUsage.ts`
  (1 s `setInterval`) which is mounted by `LiveChatPerfOverlay` /
  `ChatPerfScreen` under dev-tools. It does not poll in production and does
  not poll while hidden because it is not mounted. Cost when mounted: one
  native `getUsage()` call per second - not measured, small.

## 3a. JS and UI frame rate on iOS (added 13:12-13:16)

Source: the app's own dev-tools instrumentation, read without code changes.
`LiveChatPerfOverlay` on `dev-tools/chat-perf` shows JS fps (rAF count per
second), UI fps and UI jank (Reanimated `useFrameCallback`, jank = frame gap

> 25 ms), and CPU %; `scripts/perf/sample-perf-overlay-ios.sh` reads that
> row from the accessibility tree. `BenchFrameProbe` (mounted by `Chat.tsx` in
> dev builds) appends one JS-fps sample per second to
> `Documents/img-bench.json` in the app container, so any chat session on a
> dev build leaves a JS-fps timeline behind.

Host load average 100-120 during these captures (see the warm-start note).
Debug dev client, iPhone 16 simulator.

### Synthetic replay on `dev-tools/chat-perf` (fixture chat, no flood), 12 samples

| Metric          | median | p90 | min | max |
| --------------- | -----: | --: | --: | --: |
| JS fps          |     59 |  60 |  49 |  60 |
| UI fps          |     44 |  56 |  43 |  56 |
| UI jank / s     |      4 |   5 |   1 |   5 |
| CPU % (overlay) |     73 |  85 |  69 |  85 |

### "Run Full Suite" (deterministic flood, 15 s measure per phase, from the on-screen result table)

| Phase    | UI fps | UI jank / s | JS fps | drop % |
| -------- | -----: | ----------: | -----: | -----: |
| raid     |     49 |         3.3 |     29 |     49 |
| steady60 |     46 |         3.4 |     30 |     45 |

`chatPerfSuite.ts:17` says the JS fps here is inflated downward by the
flood timer and Metro, and names UI jank per second as the metric that
answers "no jank". Per-minute JS fps from the probe file during the suite:
13:14 median 35.5, p10 25, min 14 (56 samples); the minute after, idle
replay, median 60, p10 60.

## 3c. Live Caedrel chat, iOS, 5 minutes (13:16-13:21, host load 100-120)

`FOAM_CHAT_CHANNEL_ID=92038375 FOAM_CHAT_CHANNEL_NAME=caedrel FOAM_DURATION_SECONDS=300 scripts/perf/steady-state-ios.sh caedrel-5min`
(Caedrel was the top stream, 22-24K viewers). The screenshot confirmed the
live chat. Same Debug dev client and simulator as section 3; host load was
100-120 during this run, so CPU is inflated against the morning xqc run.

| Metric                    | median |   p90 | min |   max |
| ------------------------- | -----: | ----: | --: | ----: |
| Process CPU % (1 s delta) |     82 |   225 |  14 |   265 |
| RSS MB (host memory)      |  1,104 | 2,059 | 840 | 2,138 |
| Threads                   |    168 |   181 | 136 |   186 |

RSS first-fifth median 1,646 MB -> last-fifth median 947 MB (-699 MB): a
trim happened mid-run, unlike the morning xqc run which only grew. Thread
count is 3-4x the morning run (40-64). Thread names from the 10 s `sample`
at the end (count of threads per name):

| Thread name                                                                    | Count |
| ------------------------------------------------------------------------------ | ----: |
| dav1d-worker                                                                   |   176 |
| unnamed                                                                        |    36 |
| com.apple.coremedia.JVTlib                                                     |    30 |
| DispatchQueue_16: com.apple.root.user-initiated-qos                            |    13 |
| DispatchQueue_10: com.apple.root.utility-qos                                   |     9 |
| DispatchQueue_37256: com.hackemist.SDImageFramePool.fetchQueue                 |     7 |
| DispatchQueue_13: com.apple.root.default-qos                                   |     7 |
| DispatchQueue_37075: com.hackemist.SDImageFramePool.fetchQueue                 |     6 |
| DispatchQueue_2269: com.apple.avfoundation.globaloperationqueue.0x6000000a4790 |     6 |
| com.apple.coremedia.formatwriter.qtmovie                                       |     6 |
| hades                                                                          |     4 |
| DispatchQueue_37062: com.hackemist.SDImageFramePool.fetchQueue                 |     4 |

Top of stack in the same `sample`: `hermes::vm::Interpreter::interpretFunction`
first among non-idle frames, then `vImage` colour transforms (emote decode)
267 samples and `H264SW.videocodec` 214 samples. Software H.264 decode is
running inside the app process on the simulator; on a device the player's
WebContent process does hardware decode, so this cost does not transfer.

JS fps from `BenchFrameProbe` (`Documents/img-bench.json`) over the same
window, one sample per second, n = 280:

| Metric               |     Value |
| -------------------- | --------: |
| median               |        46 |
| p10                  |        29 |
| p90                  |        60 |
| min                  |         6 |
| seconds under 55 fps | 224 (80%) |
| seconds under 30 fps |  29 (10%) |

Per minute: 13:17 median 43 (p10 18), 13:18 48 (32), 13:19 44 (33), 13:20
48.5 (30). Dev build, loaded host: the level will move on release; the
shape (a floor of 15-30 fps seconds through the run) is the finding to
re-check on a device.

## 3b. List scroll on the Top tab (added 13:10-13:20)

Script: `scripts/perf/scroll-top-ios.sh` / `scroll-top-android.sh`. 20 flings
(0.8 -> 0.3 of screen height, 250 ms, direction flipped every 5) with 0.8 s
gaps, process sampled once per second. Host load average 100-120 during
these runs (see the warm-start note), so absolute CPU is inflated.

### iOS, Debug dev client, iPhone 16 simulator, logged out, 3 runs

| Run | CPU % median | CPU % p90 | CPU % max | RSS median MB | RSS max MB |
| --- | -----------: | --------: | --------: | ------------: | ---------: |
| 1   |           75 |       109 |       129 |           797 |      1,252 |
| 2   |           61 |        85 |        90 |         1,150 |      1,274 |
| 3   |           55 |        82 |        90 |         1,275 |      1,335 |

Across runs: CPU median 61, p90 of the three medians 75. RSS climbs run over
run as more stream thumbnails are decoded: `index.js` sizes the `expo-image`
memory cache at 12% of _host_ RAM on the simulator (48 GB -> the 384 MB
ceiling), so the simulator never trims. On a device the cap is 96-384 MB.
The CPU figure covers both the JS thread (list commits, `LiveStreamCard`
renders) and the main thread (image decode); `ps` cannot split them. The
end-of-scroll screenshot confirmed the list moved to the 8-9K-viewer rows.

### Android

**Not measured in this session.** Both attempts hit a `Process system isn't
responding` dialog on the Pixel_9 emulator (system_server ANR under the host
load), and the app process had been killed, so the first run recorded a
cold dev-client boot instead of a scroll (386 frames in 102 s, PSS 186 MB -
discarded, kept in `runs/scroll-top-android/top-scroll-run1.gfxinfo.txt`
for the record). Re-run `scroll-top-android.sh` with the app already loaded
and the host idle.

## 4. Bundle inventory (production iOS export of `main`)

`EXPO_PUBLIC_APP_VARIANT=production npx expo export --platform ios` into the
scratchpad. `.expo/atlas.jsonl` only recorded the 8-module polyfill prelude
(the running dev Metro also writes that file), so the numbers come from
`source-map-explorer` on a second `--no-bytecode --source-maps` export.

| Artifact                                                          |                                                                                                  Bytes |
| ----------------------------------------------------------------- | -----------------------------------------------------------------------------------------------------: |
| Hermes bytecode `index-*.hbc` (this export)                       |                                                                                              7,972,828 |
| `main.jsbundle` in `app-production.ipa` (1.0.7 build 317, 11 Aug) |                                                                                              7,955,984 |
| Minified JS before Hermes                                         |                                                                                              6,963,352 |
| Files in bundle                                                   | 3,880 (843 under `src/` = 1,315 KB; 3,025 under `node_modules/` = 4,945 KB; 540 KB unmapped/no-source) |

Local `.env` sets `EXPO_PUBLIC_WITH_ROZENITE=true`, so a local export carries
a 2.3 KB rozenite require-profiler prelude that the EAS-built IPA does not
(`strings main.jsbundle | grep -c rozenite` = 0). Everything else matches.

Top packages (full table: `runs/bundle-top-packages.md`):

|  KB |    % | Package                                                                                                      |
| --: | ---: | ------------------------------------------------------------------------------------------------------------ |
| 754 | 11.1 | react-native-reanimated (layout animation presets alone: Zoom 25, Fade 20, Flip 20, Bounce 19, Rotate 19 KB) |
| 562 |  8.3 | react-native                                                                                                 |
| 464 |  6.8 | expo-router                                                                                                  |
| 404 |  5.9 | src/components/Chat                                                                                          |
| 363 |  5.3 | zod (v4 core + classic)                                                                                      |
| 779 | 11.2 | @sentry/* combined (core 295, react-native 248, browser 101, browser-utils 49, feedback 48, react 38)        |
| 258 |  3.8 | @shopify/react-native-skia                                                                                   |
| 113 |  1.7 | @legendapp/list                                                                                              |
| 111 |  1.6 | react-reconciler                                                                                             |
| 103 |  1.5 | react-native-gesture-handler                                                                                 |
| 102 |  1.5 | react-native-svg                                                                                             |
| 101 |  1.5 | react-native-keyboard-controller                                                                             |
|  99 |  1.5 | @expo/ui                                                                                                     |
|  95 |  1.4 | src/screens/Preferences                                                                                      |
|  80 |  1.2 | @shopify/flash-list                                                                                          |
|  77 |  1.1 | react-native-pulsar (`Presets.ts` 69 KB)                                                                     |
|  48 |  0.7 | src/services/chatterino-service.ts (embedded JSON)                                                           |
|  43 |  0.6 | src/screens/DevTools (9 `dev-tools` routes ship in production)                                               |

Modules >= 100 KB not needed for the first screen: Reanimated layout-animation
presets (~100 KB across five files, only chat rows use `FadeInUp`), Skia
(258 KB, only 7TV paints and skeletons), `@legendapp/list` (113 KB, chat
only), `zod` (363 KB - but see below, it _is_ on the boot path today),
Sentry feedback (48 KB). With `inlineRequires: true` (`metro.config.js:31`)
these cost bundle bytes and Hermes load/parse, not module execution, until
first use.

## 5. What runs on the boot path (static inventory, file:line)

Order follows the import graph from `index.js`. "Eager" means the code runs
during bundle execution or the first render, before the first frame.

| #   | Where                                                                 | What                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Eager?                          |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | `index.js:37-59`                                                      | `react-native-device-info` total memory read + `expo-image` `Image.configureCache` (iOS)                                                                                                                                                                                                                                                                                                                                                                  | yes, before `expo-router/entry` |
| 2   | `src/app/_layout.tsx:1-26`                                            | `wdyr` (no-op unless `EXPO_PUBLIC_ENABLE_WDYR`), `expo-dev-client`, `configureReanimatedLogger`, `enableFreeze(false)`, `Appearance.setColorScheme('dark')`, `WebBrowser.maybeCompleteAuthSession()`, `sweepOversizedSentryEnvelopes()` (deferred with `setTimeout 0`, then a synchronous directory walk of the Sentry cache), `initSentry()`, `installGlobalErrorHandlers()`                                                                             | yes                             |
| 3   | `src/lib/sentry.ts:97-150`                                            | `Sentry.init` with `expoRouterIntegration`, `reactNativeTracingIntegration`, `appStartIntegration`, `graphqlIntegration`, `mobileReplayIntegration`, `attachScreenshot` + `attachViewHierarchy`, `enableLogs`, `appHangTimeoutInterval: 1000`. Native `RNSentrySDK.start()` also runs first thing in `AppDelegate.swift:19`. Disabled in dev unless `EXPO_PUBLIC_ENABLE_SENTRY=true`, so its JS cost was not in the dev measurements                      | yes (prod)                      |
| 4   | `src/lib/react-query/query-provider.tsx:75-118`                       | module scope: `InteractionManager.runAfterInteractions` arming the 2 s connectivity poll, a 15 s `setInterval` reconcile timer that lives forever (background included), `focusManager.setEventListener`. No TanStack persister exists - the query cache is memory only, so there is no hydration cost                                                                                                                                                    | yes                             |
| 5   | `src/hooks/useOnReconnect.ts:4`                                       | `onlineManager.setEventListener` -> `expo-network` listener (imported by `RouterEffects.tsx:1`)                                                                                                                                                                                                                                                                                                                                                           | yes                             |
| 6   | `src/store/preferenceStore.ts:205-232`                                | `ensureObservablePersistenceConfig`, `preferences$` observable, `persistObservable` (synchronous MMKV `getString` + `JSON.parse`, small - `FOAM_V1_PREFERENCES` is not present in `obsPersist` on this profile, so it is stored in the default instance), `when(isLoadedLocal)` migrations. Pulled in by `AnalyticsProvider.tsx:33` (`usePreference`)                                                                                                     | yes                             |
| 7   | `src/hooks/firebase/analytics.ts:12`                                  | `getAnalytics(getApp())` at module scope plus `@react-native-firebase/installations` side-effect import; `setAnalyticsCollectionEnabled` in the provider effect                                                                                                                                                                                                                                                                                           | yes                             |
| 8   | `src/hooks/firebase/useRemoteConfig.ts:45-55, :91`                    | handle is lazy, but `ForceUpdateModal` (`RootLayoutNav.tsx:52`) calls `useRemoteConfig` on first render -> `setConfigSettings`, `setDefaults`, `fetchAndActivate` (network; landed 1.6 s after `runApplication` in dev)                                                                                                                                                                                                                                   | yes                             |
| 9   | `src/components/RootLayout/RootLayoutShell.tsx:72-101`                | `Font.loadAsync` of 6 "critical" fonts (Instrument Serif x2, Montserrat 400/500 + italics, 1.4 MB of TTF) in an effect; 10 more (Montserrat 300-900) after interactions. iOS only: the `expo-font` config plugin embeds Montserrat/Instrument Serif natively for Android (`app.config.ts:302-339`) but the iOS list has only Source Code Pro (`:297-301`)                                                                                                 | yes (iOS)                       |
| 10  | `RootLayoutShell.tsx:107`                                             | `PlayerWebViewPrewarm`: a hidden `WebView` mounted 2.5 s after interactions, kept 10 s (WebKit processes seen at +15 s in the log)                                                                                                                                                                                                                                                                                                                        | deferred                        |
| 11  | `src/Providers/Providers.tsx:112-130`                                 | Provider stack: Auth, AccentColor, SafeArea, GestureHandler, ErrorBoundary, `KeyboardProvider preload`, Portal, `__DEV__` Rozenite hooks (network, performance monitor, require profiler, MMKV storage plugin - dev only but the modules ship), Analytics, Query, Toaster, `GlobalErrorGate`, `ShakeToReport` (accelerometer), `OfflineBanner`, `PressablesConfig`, `ActionMenuHost`, `ChangelogAndroidHost`, `MediaPermissionHost`                       | yes                             |
| 12  | `src/context/AuthContext.tsx:517-575`                                 | `populateAuthState`: two `SecureStore` reads, then for a logged-in user `validateToken` -> `getUserInfo` (two sequential network calls, `:336`, `:352`) before `ready: true`; anon path sets `ready` synchronously after the read and validates in the background (`:470-490`). 12 s fallback timer. `prefetchInitialData` after interactions                                                                                                             | yes, gates the first screen     |
| 13  | `src/app/index.tsx:15-52`                                             | Reads `ONBOARDING_SEEN_KEY` from MMKV; renders 6 `LiveStreamCardSkeleton`s until `ready`; then `Redirect` to `/tabs/following` or `/tabs/top`                                                                                                                                                                                                                                                                                                             | yes                             |
| 14  | `src/components/RootLayout/RouterEffects.tsx:76-197`                  | `useClearExpiredStorageItems` (after interactions, walks all `storageService` keys), `useIcloudPreferenceSync`, `usePopulateAuth`, QuickActions `isSupported` + `setItems`, `Linking.getInitialURL` + 100 ms timer, `zod` schema for the quick-action href (`:31`) - this is what pulls the 363 KB `zod` into the boot path; `twitch-service.ts` also uses `zod` for API parsing                                                                          | yes                             |
| 15  | `src/hooks/useOTAUpdates.ts` (`OTAUpdates` at `RootLayoutNav.tsx:81`) | `checkAutomatically: 'NEVER'` in config, JS-driven: pending-update handling and listeners at mount; foreground check gated as above                                                                                                                                                                                                                                                                                                                       | yes                             |
| 16  | `src/store/chat/observables/chatStore.ts:114-125, :250`               | `persistObservable(chatStore$.persisted)` -> synchronous MMKV read + `JSON.parse` of `chat-store-v2`; `hydrateDeferredChatState` after interactions (emoji set, persisted cosmetics, per-channel recent messages). **Not on the boot path**: outside chat only `utils/chat/resolveMessageEmoteParts.ts` and a dev-tools screen import it, and `inlineRequires` defers execution to first use - i.e. first chat open. See section 6                        | first chat open                 |
| 17  | Native, `AppDelegate.swift:19-32`                                     | `RNSentrySDK.start()`, `ExpoReactNativeFactory` creation, `FirebaseApp.configure()` (Analytics, Installations, Remote Config, AB testing pods), `startReactNative`. `expo-updates` is enabled with `EXUpdatesCheckOnLaunch = NEVER` and `EXUpdatesLaunchWaitMs = 0`; it still opens its database and reads the embedded manifest on the launch path (not measured). `expo-insights` sends a launch event to `i.expo.dev` at boot (seen at +12.8 s in dev) | yes                             |

Splash hold strategy: Expo Router calls `preventAutoHideAsync` in a
`setTimeout` at registration (`node_modules/expo-router/build/renderRootComponent.js:86`)
and hides on `NavigationContainer.onReady` in the next animation frame
(`global-state/store.js:93-99`). The app never calls `SplashScreen` itself
(`grep -rni splash src` finds only fixtures). So the splash hides when the
`index` route commits, which shows the 6-card skeleton while auth resolves.
Perceived first content = skeleton at `CONTENT_APPEARED`; real content
arrives ~1.7 s later in dev (auth chain + first query).

## 6. Persisted state on disk (the largest single finding)

Read straight from the MMKV files with a small record parser
(`scratchpad/mmkv-read.mjs`; append-log format, newest record wins).

| Store                                        |                                                  iOS simulator profile |         Android emulator profile |
| -------------------------------------------- | ---------------------------------------------------------------------: | -------------------------------: |
| `obsPersist` file (Legend-State persistence) |                                      64 MB allocated, 52.6 MB non-zero | 32 MB allocated, 3.6 MB non-zero |
| `chat-store-v2` newest value (JSON)          |                                             **20.62 MB** (14 channels) |             3.45 MB (3 channels) |
| of which `channelCaches`                     |                                       20.2 MB, 0.75-1.8 MB per channel |  3.1 MB, 0.67-1.2 MB per channel |
| of which `globalCaches`                      | 394 KB (303 Twitch, 44 7TV, 65 BTTV, 11 FFZ emotes; 439 Twitch badges) |                           418 KB |
| `chat-recent-messages` (one key per channel) |                                   4 MB file, ~305 KB per channel value |                        2 MB file |
| `storageService`                             |                                                        513 KB non-zero |                           660 KB |
| `image-cache-manifest`                       |                                                                 463 KB |                            33 KB |

`MAX_CACHED_CHANNELS = 20` (`src/store/chat/types/constants.ts:163`), so the
ceiling is ~20 x 1.5 MB = ~30 MB of JSON per profile.

Costs attached to that value:

- Read: `ObservablePersistMMKV.getTable` does `storage.getString(table)` and
  `JSON.parse` synchronously the first time `chatStore.ts` executes
  (`node_modules/@legendapp/state/persist-plugins/mmkv.mjs:43-54`). Node/V8
  parses the 20.6 MB string in 45 ms median (57.8 ms p90); Hermes on a phone
  is slower and the parsed object graph then lives in the JS heap for the
  session. **Hermes-on-device time: hypothesis - unmeasured.**
- Write: the foam patch coalesces saves per table, but each save still
  re-serialises the whole table (`mmkv.mjs:15-18`, `set` at `:60-68`), so
  every channel-cache update is a `JSON.stringify` of up to 30 MB plus an
  MMKV write of the same size. This is why the file is 64 MB: MMKV appends
  until it must compact.
- `hydrateDeferredChatState` (`chatStore.ts:210-248`) also parses every
  per-channel recent-messages value (14 x ~300 KB here) after interactions.

## 7. Native launch inventory (production IPA 1.0.7, build 317)

- `Foam.app` 69 MB. Main binary 28.7 MB (`__TEXT` 23.8 MB, `__DATA_CONST`
  1.1 MB, `__DATA` 2.5 MB). Embedded frameworks: React 12 MB, hermesvm
  4.9 MB, ExpoModulesJSI 1.4 MB, ReactNativeDependencies 1.2 MB. Everything
  else is statically linked (`useFrameworks: 'static'`, 429 pods in
  `Podfile.lock`). 92 load commands, 4 `@rpath` frameworks. `Assets.car`
  4.2 MB. Minimum iOS 16.4.
- `__objc_nlclslist` (classes with `+load`) ~142 entries; `__objc_classlist`
  ~1,900 classes. Dyld pre-main time on device: **not measured - needs
  device**.
- Android (`android/gradle.properties`, `app/build.gradle`): Hermes on,
  New Architecture on, `enableMinifyInReleaseBuilds` + `shrinkResources` on,
  `enableBundleCompression = false` (bytecode stays uncompressed for mmap),
  `useLegacyPackaging = true` (native libs compressed in the APK, extracted at
  install), AGP 8.12 (R8 full mode is the default there; nothing overrides
  it), `reactNativeArchitectures` includes x86/x86_64/armeabi-v7a. No
  `reportFullyDrawn`, no Baseline Profile / `profileinstaller`. 16 KB page
  alignment: not checked - no local APK/AAB.

## 8. Small measured facts used by the frontier

- `zod` cold `require` in Node: 24.5 ms median (5 cold processes; first run
  50.8 ms). V8 proxy for Hermes module execution - **directional only**.
- Runtime-loaded fonts on iOS: 1.4 MB "critical" (6 files) + the rest of
  the 6.0 MB Montserrat directory deferred; Android embeds them natively.
- `expo-image` memory cache is bounded at boot from `index.js` (12% of RAM,
  96-384 MB); `cache-service.ts` caps decoded emotes at 5% of RAM (128-600 MB).
