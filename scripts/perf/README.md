# Startup and steady-state perf harness

Re-runnable measurements behind `research/foam-perf/baseline.md`. Every
script prints median and p90 across runs and writes raw captures next to a
`summary.json` so a later run can be diffed against this baseline.

Nothing here touches `src/`. The scripts read the unified log (iOS) or
logcat (Android) and use the markers the app already emits:

- `expo-insights` events (`PROCESS_START`, `RUN_JS_BUNDLE_START`,
  `RUN_JS_BUNDLE_END`, `APP_STARTUP_END`, `CONTENT_APPEARED`). These carry
  the true epoch of the event, so they are exact even though the log line is
  written later.
- Native lifecycle lines (`[FirebaseCore]` inside `didFinishLaunching`,
  `Window became key`, Expo module registration, the Metro bundle request).
- The app's own `logger` output (`isAuthCallbackUrl`, `twitch token
validated`, `GET /helix/streams 200`). These only exist in dev builds and
  on Android in debug logcat. On a release build the `expo-insights` markers
  and `Displayed` still work; set `FOAM_DONE_MARKER` to one of those.

## Prerequisites

- iOS: a booted simulator with the app installed. For the dev client, Metro
  must be running (`bun run start`). Do not point at a simulator another
  session is using.
- Android: an emulator or device on `adb`, app installed, Metro reachable at
  `http://10.0.2.2:8081` from the emulator.
- `node` >= 20 on PATH.

## Scripts

| Script                                                    | What it measures                                                                                                                                     | Runtime                       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `cold-start-ios.sh [runs]`                                | Cold-start stages (ms since the launch command) on a simulator                                                                                       | ~30 s per run                 |
| `cold-start-android.sh [runs]`                            | `am start -W` time-to-first-frame plus logcat stages                                                                                                 | ~40-90 s per run (dev)        |
| `steady-state-ios.sh [label]`                             | Process CPU% and RSS every 5 s in a live chat, plus a `sample` call-stack capture at the end                                                         | `FOAM_DURATION_SECONDS` (600) |
| `steady-state-android.sh [label]`                         | PSS / heaps / CPU every 5 s in a live chat, plus the `gfxinfo` frame histogram                                                                       | `FOAM_DURATION_SECONDS` (300) |
| `warm-start-ios.sh [cycles]`                              | Backgrounds the app behind Safari, foregrounds it, counts requests / socket revives / OTA checks in the first 15 s and writes `cycle-N.js-lines.txt` | ~35 s per cycle               |
| `scroll-top-ios.sh [label]`                               | 20 flings on the Top tab through `argent run gesture-swipe`, process CPU% and RSS sampled every second                                               | ~45 s                         |
| `scroll-top-android.sh [label]`                           | Same with `input swipe`; prints the `gfxinfo` frame histogram and PSS before/after                                                                   | ~30 s                         |
| `sample-perf-overlay-ios.sh [label] [samples]`            | Reads JS fps, UI fps, UI jank and CPU from the `dev-tools/chat-perf` overlay through the accessibility tree (`argent run describe`)                  | ~5 s per sample               |
| `summarize-cold-start*.mjs`, `summarize-steady-state.mjs` | Recompute medians from an existing capture directory                                                                                                 | instant                       |

Existing chat profilers (`capture-chat-instruments.sh`,
`capture-chat-react-devtools.sh`) are documented in
`.claude/skills/foam-chat-performance-audit/SKILL.md`.

## JS fps without a debugger

Dev, internal and e2e builds mount `BenchFrameProbe` inside `Chat.tsx`. It
appends one JS-fps sample per second to `Documents/img-bench.json` in the app
container, so every chat session leaves a timeline behind. Read it after a
run:

```bash
D="$(xcrun simctl get_app_container <UDID> foam-tv-dev data)/Documents/img-bench.json"
python3 -c "
import json,statistics
s=sorted((x for b in json.load(open('$D'))['frames'] for x in b['samples']), key=lambda x:x['t'])
w=[x['fps'] for x in s if x['t'] >= <epoch ms of run start>]
print(len(w), statistics.median(w), sorted(w)[len(w)//10], min(w))"
```

The `dev-tools/chat-perf` screen adds UI fps and UI jank (Reanimated frame
callback) on top; `sample-perf-overlay-ios.sh` samples that overlay and
"Run Full Suite" (tap at 0.5, 0.195) prints a per-phase table on screen that
`argent run describe` can read.

## Known blockers

- CDP into the app (`argent debugger-evaluate`, `react-profiler-*`, a direct
  `ws` client): Metro's inspector proxy accepts the socket only with an
  `Origin: http://localhost:8081` header and then closes it with 1006 about
  13 ms later, before any message, when another inspector client (Rozenite,
  another argent session) already holds the page. Close that client first.
- The Android emulator shows `Process system isn't responding` when the host
  load average is far above the core count; every capture during that state
  is invalid (the first `scroll-top-android` run recorded a cold boot).
  Check `uptime` before an Android run.
- xctrace records nothing against a simulator; `steady-state-ios.sh` uses
  `sample` instead.

## Examples

```bash
# 5 dev-client cold starts on the default iPhone 16 simulator
FOAM_IOS_UDID=AA1A3696-8F85-4AE2-96CA-1E5C69018B1C scripts/perf/cold-start-ios.sh 5

# A release/TestFlight build installed on a simulator (embedded bundle, no Metro)
FOAM_LAUNCH_MODE=launch FOAM_BUNDLE_ID=foam-tv FOAM_PROCESS_NAME=Foam \
  FOAM_DONE_MARKER='Insights: CONTENT_APPEARED' scripts/perf/cold-start-ios.sh 5

# Android dev client, 5 runs
scripts/perf/cold-start-android.sh 5

# 10 minutes in xqc's chat on iOS
FOAM_DURATION_SECONDS=600 scripts/perf/steady-state-ios.sh xqc

# 5 warm-start cycles, 3 Top-tab scroll passes, 12 overlay samples on iOS
scripts/perf/warm-start-ios.sh 5
for r in 1 2 3; do scripts/perf/scroll-top-ios.sh top-scroll-run$r; done
scripts/perf/sample-perf-overlay-ios.sh chat-perf-replay-idle 12

# Re-summarize an old capture
node scripts/perf/summarize-cold-start.mjs research/foam-perf/runs/cold-start-ios/runs.csv
```

## Reading the numbers

- The dev client is not the app users run. Native code is unoptimised, the
  bundle is served over HTTP with lazy bytecode, React runs in development
  mode, and the dev launcher adds a wait before the RN host starts
  (`window_key` -> `expo_modules_register`). Compare dev numbers only with
  other dev numbers on the same simulator.
- `content_appeared` is `RCTContentDidAppear`: the first RN frame, which for
  Foam is the `index` route skeleton. `first_screen_data` is when the first
  screen's data request returned; the list paints a frame or two later.
- Noise: the p90-minus-median spread from the baseline runs is the smallest
  change worth reporting. See "Noise" in `research/foam-perf/frontier.md`.
- Simulator memory (RSS) is host memory and does not reflect device
  pressure. Use it for growth over time, not for absolute values.
