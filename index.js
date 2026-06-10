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

require('expo-router/entry');
