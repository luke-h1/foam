/* eslint-disable @typescript-eslint/no-require-imports */

if (__DEV__ && !process.env.EXPO_PUBLIC_REACT_PERF_TRACKS) {
  require('react-native/Libraries/Core/setUpPerformance');
  // eslint-disable-next-line no-console
  console.timeStamp = function timeStamp() {};
  try {
    Object.defineProperty(globalThis.performance, 'measure', {
      configurable: true,
      value: function measure() {},
    });
    Object.defineProperty(globalThis.performance, 'clearMeasures', {
      configurable: true,
      value: function clearMeasures() {},
    });
  } catch (error) {
    void error;
  }
}

// Bound expo-image's in-memory decoded cache. iOS only: `configureCache` is
// declared `@platform ios` and has no counterpart in expo-image's Android
// module, so calling it there throws into the catch below. Android needs no
// equivalent: Glide's default MemorySizeCalculator already scales the memory
// cache and bitmap pool to the device's memory class. SDWebImage defaults both
// tiers to unbounded (maxMemoryCost/maxDiskSize: 0). Under sustained chat
// raids that unbounded working set grew until iOS jettisoned the app
// (std::bad_alloc / WatchdogTermination in busy channels like caedrel).
// `maxMemoryCost` is in bytes, so a flat 2GB let the cache hold ~2GB of
// decoded emote bitmaps on top of the video WebView and JS heap. Use ~12% of
// physical RAM, clamped to [96MB, 384MB], so smaller phones get a lower cap.
// NSCache still purges itself under OS memory pressure.
if (process.env.EXPO_OS === 'ios') {
  try {
    const MIN_MEMORY_CACHE_BYTES = 96 * 1024 * 1024;
    const MAX_MEMORY_CACHE_BYTES = 384 * 1024 * 1024;
    let totalMemoryBytes = 0;
    try {
      const deviceInfo = require('react-native-device-info/src/internal/nativeInterface');
      const DeviceInfo = deviceInfo.default ?? deviceInfo;
      totalMemoryBytes = DeviceInfo.getTotalMemorySync?.() ?? 0;
    } catch {
      // device-info is unavailable. Fall through to the fixed ceiling below.
    }
    const scaled =
      totalMemoryBytes > 0
        ? Math.floor(totalMemoryBytes * 0.12)
        : MAX_MEMORY_CACHE_BYTES;
    const maxMemoryCost = Math.max(
      MIN_MEMORY_CACHE_BYTES,
      Math.min(MAX_MEMORY_CACHE_BYTES, scaled),
    );
    require('expo-image').Image.configureCache({
      maxMemoryCost,
      maxDiskSize: 512 * 1024 * 1024,
    });
  } catch {
    // expo-image is unavailable. The cache keeps its defaults.
  }
}

require('expo-router/entry');
