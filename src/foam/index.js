/* eslint-disable @typescript-eslint/no-require-imports */

if (__DEV__ && !process.env.EXPO_PUBLIC_REACT_PERF_TRACKS) {
  // React's dev-only component performance tracks structuredClone every
  // rendered component's props into buffered performance.measure entries on
  // each commit. In busy chats this allocated ~100MB/s (GC pinned a core) and
  // leaked ~50MB/min of retained entries. React gates the feature by checking
  // `typeof console.timeStamp === 'function'` ONCE and caching the result
  // (ReactFabric-dev.js's `supportsUserTiming`), so a plain `delete` is racy:
  // if anything re-creates `console.timeStamp` after the delete (or Fast
  // Refresh re-runs this file against an already-initialized renderer whose
  // `supportsUserTiming` was cached `true` before the delete), React ends up
  // calling `console.timeStamp` while it's undefined -> "TypeError: undefined
  // is not a function" during the very first render, which corrupts React's
  // work loop into throwing "Should not already be working" right after.
  // A permanent no-op keeps `supportsUserTiming` correctly false-equivalent
  // (call is always safe) regardless of when React's renderer bundle reads
  // it. Must be a real function, not `undefined`: react-native-worklets
  // copies console via Object.entries and reads `.name` on every value, so an
  // own property holding undefined crashes its init.
  // eslint-disable-next-line no-console
  console.timeStamp = function timeStamp() {};
}

// Bound expo-image's in-memory decoded cache. By default both tiers are
// unbounded (maxMemoryCost/maxDiskSize: 0); under sustained chat raids the
// decoded working set grew until iOS jettisoned the app (std::bad_alloc /
// WatchdogTermination in busy channels like caedrel). `maxMemoryCost` is in
// BYTES (SDWebImage: "the bytes size held in memory"), so a flat 2GB let the
// cache grow to ~2GB of decoded emote bitmaps on top of the video WebView and
// JS heap. Scale it to the device instead: ~12% of physical RAM, clamped to
// [96MB, 384MB], so smaller phones cap tighter and no device parks gigabytes of
// decoded images. NSCache still self-purges under OS memory pressure.
try {
  const MIN_MEMORY_CACHE_BYTES = 96 * 1024 * 1024;
  const MAX_MEMORY_CACHE_BYTES = 384 * 1024 * 1024;
  let totalMemoryBytes = 0;
  try {
    const deviceInfo = require('react-native-device-info');
    const DeviceInfo = deviceInfo.default ?? deviceInfo;
    totalMemoryBytes = DeviceInfo.getTotalMemorySync?.() ?? 0;
  } catch {
    // device-info unavailable — fall through to the fixed ceiling below.
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
  // expo-image unavailable (e.g. web) — cache stays default.
}

require('expo-router/entry');
