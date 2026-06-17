/* eslint-disable @typescript-eslint/no-require-imports */

if (__DEV__ && !process.env.EXPO_PUBLIC_REACT_PERF_TRACKS) {
  // React's dev-only component performance tracks structuredClone every
  // rendered component's props into buffered performance.measure entries on
  // each commit. In busy chats this allocated ~100MB/s (GC pinned a core) and
  // leaked ~50MB/min of retained entries. React gates the feature on
  // console.timeStamp + performance.measure existing, so removing one disables
  // it. Set EXPO_PUBLIC_REACT_PERF_TRACKS=1 when you want the tracks back for
  // a React DevTools Performance session.
  // Must be `delete`, not `= undefined`: react-native-worklets copies console
  // via Object.entries and reads `.name` on every value, so an own property
  // holding undefined crashes its init.
  // eslint-disable-next-line no-console
  delete console.timeStamp;
}

// Bound expo-image's image cache. By default both tiers are unbounded
// (maxMemoryCost/maxDiskSize: 0); under sustained chat raids the decoded working
// set grew multi-GB and could get the app jettisoned. Cap the in-memory decoded
// cache at 2GB (SDWebImage evicts least-recently-used past the limit, and
// NSCache also drops under OS memory pressure) and the disk cache at 512MB.
try {
  require('expo-image').Image.configureCache({
    maxMemoryCost: 2 * 1024 * 1024 * 1024,
    maxDiskSize: 512 * 1024 * 1024,
  });
} catch {
  // expo-image native module unavailable (e.g. web) — cache stays default.
}

require('expo-router/entry');
