# Android native-module parity plan

Branch: `feat/android-release-prep`. Scope: the five local Expo modules in `modules/`, each of which ships an iOS (`ios/`, Swift) implementation and **no** `android/` (Kotlin) implementation. Nothing here is a build break today - every JS-facing module has a graceful `.android.ts` stub, so Android compiles and degrades safely. "Parity" is a per-module decision: keep the intentional stub, or bind a real Android native.

## How platform resolution works here (read first)

Each module's default resolver `*.ts` uses `requireOptionalNativeModule(...)`:

```ts
// modules/cpu-usage/src/CpuUsageModule.ts
export default requireOptionalNativeModule<CpuUsageNativeModule>('CpuUsage') ??
  unavailableModule;
```

That already returns the native module when present and the stub when not. But each module also ships a `*.android.ts` stub, and **Metro resolves `.android.ts` over `.ts` on Android**, so the stub currently shadows any native. Therefore the rule when adding a native Android impl is:

> **Delete the `*.android.ts` stub.** Android then falls through to `*.ts`, whose `requireOptionalNativeModule` binds the Kotlin module. No third code path.

## Decision matrix

| Module                  | iOS does                                      | Recommended Android action                                                                                                                                                                   | Effort   |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `changelog`             | SwiftUI "what's new" sheet                    | **Nothing** - already has full Android path (`ChangelogAndroidHost.android.tsx` + presenter)                                                                                                 | done     |
| `image-cache-limits`    | Bounds SDWebImage decoded-mem cache           | **Shipped**: Glide (expo-image's Android backend) is bounded by default; `ImageCacheLimitsApplicationLifecycle.kt` tiers that bound by device (`setMemoryCategory` LOW/NORMAL/HIGH) - see §5 | shipped  |
| `image-memory-pressure` | `os_proc_available_memory()` pre-jetsam probe | **Keep stub** (return 0). Android's model is `onTrimMemory`, not a headroom poll. Optional native below if you want the JS monitor live                                                      | optional |
| `cpu-usage`             | Per-process CPU% (dev perf overlay)           | **Optional native** - easy `/proc` read; nice for the Android perf overlay. Dev-only, non-blocking                                                                                           | low      |
| `icloud-sync`           | `NSUbiquitousKeyValueStore` preference sync   | **Keep stub** - no Android equivalent to iCloud; app layer also hard-gates on iOS                                                                                                            | none     |

Bottom line for the release: **only `cpu-usage` is worth a real native, and only because it's cheap.** The rest are correctly iOS-only. The two must-do release items are the verification checklist (§6) and the patch review (§5).

---

## 1. Shared scaffolding (applies to any module you make native)

Every native Android module needs three files under `modules/<name>/android/`.

### `android/build.gradle`

```gradle
apply plugin: 'com.android.library'
apply plugin: 'org.jetbrains.kotlin.android'
apply plugin: 'expo-module-gradle-plugin'

group = 'expo.modules.cpuusage'
version = '1.0.0'

android {
  namespace 'expo.modules.cpuusage'
  defaultConfig {
    minSdkVersion 24
  }
}
```

`expo-module-gradle-plugin` supplies the compile/target SDK, Kotlin config, and the `expo.modules.kotlin` dependency - keep the file this thin.

### `android/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" />
```

### `expo-module.config.json` (add the `android` block)

```json
{
  "platforms": ["apple", "android"],
  "apple": {
    "modules": ["CpuUsageModule"]
  },
  "android": {
    "modules": ["expo.modules.cpuusage.CpuUsageModule"]
  }
}
```

Kotlin source goes in `android/src/main/java/expo/modules/<name>/<Name>Module.kt`.

---

## 2. `cpu-usage` - recommended native (dev perf overlay)

iOS sums `thread_basic_info` CPU across threads; "the number top shows, can exceed 100 on multiple cores". The Android equivalent samples `/proc/self/stat` (process jiffies) against `/proc/stat` (total jiffies) and reports the delta since the last call as a percentage scaled by core count. First call returns 0 (no prior sample) - matching the "0 when unavailable" contract. This is stateful and designed to be polled repeatedly, which is exactly how `useCpuUsage.ts` drives it.

### `modules/cpu-usage/android/src/main/java/expo/modules/cpuusage/CpuUsageModule.kt`

```kotlin
package expo.modules.cpuusage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class CpuUsageModule : Module() {
  private var lastProcessTicks = 0L
  private var lastTotalTicks = 0L
  private var hasBaseline = false

  override fun definition() = ModuleDefinition {
    Name("CpuUsage")

    Function("getUsage") {
      currentCpuUsage()
    }
  }

  /**
   * Process CPU% since the previous call, scaled by core count so it matches
   * the iOS "sum across threads" number (can exceed 100 on multiple cores).
   * Returns 0 on the first call (no baseline yet) or when /proc is unreadable.
   */
  private fun currentCpuUsage(): Double {
    val processTicks = readProcessTicks() ?: return 0.0
    val totalTicks = readTotalCpuTicks() ?: return 0.0

    if (!hasBaseline) {
      lastProcessTicks = processTicks
      lastTotalTicks = totalTicks
      hasBaseline = true
      return 0.0
    }

    val processDelta = processTicks - lastProcessTicks
    val totalDelta = totalTicks - lastTotalTicks

    lastProcessTicks = processTicks
    lastTotalTicks = totalTicks

    if (totalDelta <= 0L || processDelta < 0L) {
      return 0.0
    }

    val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)
    return (processDelta.toDouble() / totalDelta.toDouble()) * 100.0 * cores
  }

  /**
   * utime (field 14) + stime (field 15) from /proc/self/stat, in clock ticks.
   * Field 2 (comm) may contain spaces/parentheses, so parse after the last ')'.
   */
  private fun readProcessTicks(): Long? {
    return runCatching {
      val stat = File("/proc/self/stat").readText()
      val afterComm = stat.substring(stat.lastIndexOf(')') + 1).trim()
      val fields = afterComm.split(Regex("\\s+"))
      // afterComm[0] is field 3 (state), so utime = index 11, stime = index 12.
      val utime = fields[11].toLong()
      val stime = fields[12].toLong()
      utime + stime
    }.getOrNull()
  }

  /**
   * Sum of all jiffies on the first line of /proc/stat ("cpu  ...").
   */
  private fun readTotalCpuTicks(): Long? {
    return runCatching {
      val firstLine = File("/proc/stat").bufferedReader().use { it.readLine() }
      firstLine
        .split(Regex("\\s+"))
        .drop(1)
        .filter { it.isNotEmpty() }
        .sumOf { it.toLong() }
    }.getOrNull()
  }
}
```

### Wire-up

1. Add the three scaffold files from §1 with `namespace 'expo.modules.cpuusage'` and module `expo.modules.cpuusage.CpuUsageModule`.
2. Update `modules/cpu-usage/expo-module.config.json` per §1.
3. **Delete `modules/cpu-usage/src/CpuUsageModule.android.ts`** so Android uses the `requireOptionalNativeModule` path.
4. Rebuild the Android dev client (native change - no OTA).

> Note on `/proc/self/stat` field offsets: field 1 is pid, field 2 is `comm` (parenthesised, may contain spaces), fields 14/15 are utime/stime (1-indexed). After slicing past the last `)`, the remaining tokens start at field 3, so utime is index 11 and stime is index 12 in that zero-based split.

---

## 3. `image-memory-pressure` - optional native (keep stub unless you tune JS)

iOS returns bytes-remaining before the process is jettisoned. Android has no direct per-process "bytes until OOM" API. The closest system signal is `ActivityManager.MemoryInfo`: `availMem - threshold` is the headroom above the low-memory kill line.

**Caveat that makes this optional:** `cache-service.ts` reads this value with **iOS-tuned thresholds** and treats non-zero as "monitoring enabled". Returning a real number here activates that monitor against Android numbers that don't mean the same thing, and expo-image on Android decodes into the native/Glide cache (bounded already), not the Java heap. So either keep the stub, **or** ship this native **and** re-tune the JS thresholds in `cache-service.ts`. **Outcome: the branch took the second path** - the native poll+trim event shipped and `cache-service.ts` gained an Android-specific 100MB headroom bound, satisfying the re-tune condition. Note the return contract: 0 means "module unavailable / monitoring disabled"; at-or-under-threshold reports a minimal positive value so it reads as critical, not disabled.

If you do want it live:

### `modules/image-memory-pressure/android/src/main/java/expo/modules/imagememorypressure/ImageMemoryPressureModule.kt`

```kotlin
package expo.modules.imagememorypressure

import android.app.ActivityManager
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ImageMemoryPressureModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ImageMemoryPressure")

    Function("getAvailableMemory") {
      availableMemoryBytes()
    }
  }

  /**
   * System memory headroom above the low-memory kill threshold, in bytes.
   * Not a true per-process pre-OOM figure (Android has no equivalent to
   * os_proc_available_memory); returns 0 below the threshold or when the
   * ActivityManager is unavailable, which the caller reads as "disabled".
   */
  private fun availableMemoryBytes(): Double {
    val context = appContext.reactContext ?: return 0.0
    val activityManager =
      context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        ?: return 0.0

    val info = ActivityManager.MemoryInfo()
    activityManager.getMemoryInfo(info)

    val headroom = info.availMem - info.threshold
    return if (headroom > 0) headroom.toDouble() else 0.0
  }
}
```

Wire-up mirrors §2 (config `android` block, delete `ImageMemoryPressureModule.android.ts`, rebuild). **Do not ship without adjusting the JS thresholds in `src/Providers/CachedEmotesProvider/cache-service.ts`.**

### Better Android-native alternative (no JS poll)

Instead of exposing a poll, register a `ComponentCallbacks2` and clear the image cache directly on `onTrimMemory`. This matches Android's push model and needs no JS changes:

```kotlin
package expo.modules.imagememorypressure

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ImageMemoryPressureModule : Module() {
  private val trimCallback = object : ComponentCallbacks2 {
    override fun onTrimMemory(level: Int) {
      if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) {
        sendEvent("onMemoryPressure", mapOf("level" to level))
      }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {}

    @Deprecated("Deprecated in API 34")
    override fun onLowMemory() {
      sendEvent("onMemoryPressure", mapOf("level" to ComponentCallbacks2.TRIM_MEMORY_COMPLETE))
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ImageMemoryPressure")

    Events("onMemoryPressure")

    Function("getAvailableMemory") { 0.0 }

    OnCreate {
      appContext.reactContext?.registerComponentCallbacks(trimCallback)
    }

    OnDestroy {
      appContext.reactContext?.unregisterComponentCallbacks(trimCallback)
    }
  }
}
```

This adds an `onMemoryPressure` event you'd subscribe to in JS to call `Image.clearMemoryCache()` (the same call already used in `clearImageCache.ts` and `cache-service.ts`). It's a JS-contract change, so treat it as a follow-up, not a release blocker.

---

## 4. `icloud-sync` - keep the stub (documented, no code)

Two reasons this stays iOS-only:

1. There is no Android equivalent to `NSUbiquitousKeyValueStore` / iCloud KVS. A Google Drive AppData-folder backing is a full feature (auth, conflict resolution), out of scope for parity.
2. The app-layer wrapper already hard-gates on iOS, so even a native Android module would be ignored:

```ts
// src/lib/icloud-sync.ts
function getICloudSyncModule(): ICloudSyncNativeModule | null {
  if (process.env.EXPO_OS !== 'ios') {
    return null;   // <- Android never reaches the native module
  }
  ...
}
```

The existing `ICloudSyncModule.android.ts` (`isAvailable() -> false`, no-op writes) is correct. Any UI gated on `isICloudPreferenceSyncAvailable()` already hides on Android. **No change.** If cross-device preference sync on Android is wanted later, it's a new feature (Drive/Firebase-backed), tracked separately - not module parity.

---

## 5. `image-cache-limits` and the iOS-only patches

### `image-cache-limits` - Android ships a Glide memory-category tier

iOS bounds `SDImageCache.shared` (unbounded by default, evicts only on memory warning). Glide - expo-image's actual Android backend (this section previously said Coil, which was wrong) - already bounds its memory cache via its default `MemorySizeCalculator`, so the unbounded-growth problem the iOS module solves does not exist on Android. The module still has **no JS surface** on Android.

What shipped instead: `ImageCacheLimitsApplicationLifecycle.kt` scales Glide's existing bound to the device via `setMemoryCategory` - LOW (0.5x) on `isLowRamDevice`, HIGH (1.5x) on >= 256MB large-heap flagships, NORMAL otherwise - posted to the main looper off the `Application.onCreate` critical path. Pressure release still works because Glide registers its own `ComponentCallbacks2` trim hooks, and the `AppGlideModule` is untouched so expo-image's AVIF/animated/okhttp integrations are unaffected. `build.gradle` pins Glide 5.0.5 to match expo-image's version.

### Patch review (release check)

Two patches touch only Apple/Swift source, so Android runs upstream:

- **`patches/expo-image@57.0.0.patch`** - patches `ios/ImageView.swift` only (the ~15fps animated-emote cap + shared CADisplayLink frame sync). These are CADisplayLink/iOS-rendering concerns; Android uses Glide's own frame scheduling. **iOS-specific by nature - no Android exposure.**
- **`patches/expo-modules-jsi@57.0.0.patch`** - patches `apple/Sources/ExpoModulesJSI/**` Swift only. On inspection it **adds** Swift helpers (`JavaScriptRef.withValue`, `JavaScriptError.from`, promise handling) to the Apple JSI layer. Android's Expo Modules JSI is a separate JNI/C++ implementation that does not use this Swift code. **iOS-only infrastructure - no equivalent Android patch required.**

Conclusion: neither iOS-only patch leaves Android exposed to a bug. Note it in the release checklist and move on.

---

## 6. Verification checklist (the actual release gate)

Do this regardless of whether you add any native - it's how you prove Android parity is safe:

1. Build an Android release/dev client (native change if you added a module - **no OTA**).
   - Local: `local-build` skill produces the release APK. Or EAS.
2. Run on a device/emulator and exercise each module surface:
   - **Changelog**: trigger a version bump -> Android host sheet shows (`ChangelogAndroidHost.android.tsx`).
   - **Settings / iCloud UI**: anything gated on `isICloudPreferenceSyncAvailable()` is hidden, no dead toggle.
   - **Dev perf overlay** (`LiveChatPerfOverlay`): if you shipped §2, CPU% now reads non-zero on Android; if not, it reads 0 without crashing.
   - **Busy chat**: no crash where `ImageMemoryPressure.getAvailableMemory()` is read (returns 0 -> monitor stays disabled).
3. `adb logcat` shows **no** `NativeModule ... not found` / unimplemented-method warnings.
4. `bun run tsc` (babel-jest skips typecheck - run it explicitly).
5. `bun test` for any module whose stub you deleted or Kotlin you added.
6. Android release build is green (`withAndroidReleaseLintFix` already handles lint); no Gradle autolinking warning about a module declaring `android` with no matching Kotlin class.

## Summary of changes if you take the recommended path

- **`cpu-usage`**: add `android/` (§1 scaffold + §2 Kotlin), add `android` block to config, delete `CpuUsageModule.android.ts`, rebuild. _(optional, low effort)_
- **Everything else**: no code. Confirm stubs via §6, note the patch review from §5.
- **Do not** OTA any of this - native modules require a fresh Android build.
