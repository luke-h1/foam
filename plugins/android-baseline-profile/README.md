# Android Baseline Profiles and startup benchmarks

A [Baseline Profile](https://developer.android.com/topic/performance/baselineprofiles/overview)
lists the classes and methods ART compiles ahead of time when the app is
installed. Without one, the code that runs at startup is interpreted and
JIT-compiled on every cold start until background dexopt or Play's cloud
profiles catch up, and the cloud profiles reset with every release.

`with-android-baseline-profile.js` ships every file in `profiles/` with the app
(AGP merges them with the profiles the AndroidX libraries ship) and adds
ProfileInstaller, which compiles the profile on sideloaded installs that do not
come from Play.

`profiles/baseline-prof.txt` is recorded from Foam's own cold start and first
stream open, with `BaselineProfileGenerator`. The recorded journey goes to the
Top streams list, opens the busiest stream, waits for the WebView player and the
first chat rows, then flings chat, so the profile covers the libraries the app
runs at startup and on the stream screen: React Native, Fabric, the Expo
modules, Reanimated, the WebView bridge and Foam's own Kotlin.

A baseline profile only pre-compiles the app's Java and Kotlin. Chat message
parsing runs in Hermes and the Twitch player runs in the WebView's own process,
so a profile does not touch either directly - it speeds up the native and bridge
code around them.

Rules that match nothing in the app are ignored, so a stale profile only loses
coverage.

Ported from https://github.com/bluesky-social/social-app/pull/12092.

## Running the benchmarks

Needs a physical device on Android 13+ (API 33) to record a profile, since
recording on older versions needs root. Measuring works from Android 9. Gradle
runs on every connected device, so with an emulator open too, pick the phone
with `ANDROID_SERIAL=<serial from adb devices>`.

1. `bun run android:benchmark:prebuild` regenerates `android/` with the
   `benchmark` module and the app's `benchmark` build type (release, but
   profileable and signed with the debug key). Plain `bun run prebuild` leaves
   them out.
2. `bun run android:benchmark:install`, then open the app and finish onboarding.
   Stay logged out: Twitch chat reads anonymously, so the Top streams and the
   stream screen fill without an account. The scripts keep the app and its data
   between runs.
3. `bun run android:benchmark` runs `StartupBenchmark`: 15 cold starts with
   nothing compiled ahead of time, then 15 with only the Baseline Profile
   compiled, like the first launch after a Play install or update.
   `LiveStreamBenchmark` measures frame timing while the stream opens and chat
   floods. Results are in the Gradle output and under
   `benchmark/build/outputs/connected_android_test_additional_output/`, with a
   Perfetto trace per iteration.

Time to initial display is the first frame. Time to full display is when the app
calls `reportFullyDrawn()`, which the Top streams list does through the
`fully-drawn` native module once its first page is on screen. Play's startup
vitals use the same call.

`LiveStreamBenchmark` measures frame timing while a Just Chatting stream opens and
chat floods, then flings chat. Logged out, use Just Chatting: the WebView player
gates mature categories behind a login, and Just Chatting has the busiest chat.

Note: on an Android preview build (this profile was recorded on an Android 17
beta, API 37), `StartupTimingMetric` and `FrameTimingMetric` return no results
because benchmark-macro 1.5.0 cannot parse the preview trace format. The journeys
still run. Read time to initial and full display from the per-iteration logcat
(`ActivityTaskManager: Displayed` and `Fully drawn`), or run the benchmarks on a
stable Android (14-16) device for the library's own metrics.

To measure what the profiles in `profiles/` are worth on top of the AndroidX
ones, compare `startupBaselineProfile` against a run with them left out:

```sh
bun run android:benchmark -Pfoam.baselineProfile=false
```

## Recording `profiles/baseline-prof.txt`

```sh
bun run android:baseline-profile
bun run android:baseline-profile:update
```

The first builds the app without R8 (`-Pfoam.benchmark.minify=false`), since R8
renames the classes a profile has to name, and runs `BaselineProfileGenerator`.
The second writes what it recorded to `profiles/baseline-prof.txt` with
`update-profile.ts`, which marks every method hot, startup and post-startup
(`HSP`), because Android 14 and older only compile methods marked hot at install,
and ART marks few of the methods it records as hot.

Re-run `bun run android:benchmark` afterwards: compiling more code is not free,
and a profile that covers too much can make startup slower.

Macrobenchmark refuses to run below 25% battery, among other checks. Recording
does not depend on timing, so it can skip a check with
`-Pandroid.testInstrumentationRunnerArguments.androidx.benchmark.suppressErrors=LOW-BATTERY`.
Do not skip them for timing runs.
