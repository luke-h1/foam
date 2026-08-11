# Expo Router owns navigation

Navigation is file-based via Expo Router (`app/` routes over React Navigation
native-stack/native-tabs). This is a foundation decision, recorded so
architecture reviews don't spend a candidate on it.

- Deep links are load-bearing: OAuth completes via the `foam://auth` magic
  link, and dev flows drive screens by URL (`/dev-tools/chat-perf?...`); the
  router's URL-first model is what makes both cheap.
- The router version is pinned with the Expo SDK, and `react-native-screens`
  underneath it is patched (ADR-0006), so navigation-library churn is
  expensive by construction.
- Screen-mount cost is managed inside this decision, not by replacing it:
  heavy screens defer work behind focus (`DeferUntilFocused`), and cards seed
  the query cache on press-in rather than the router preloading routes.

## Consequences

Route structure is filesystem structure, and everything on a route's module
graph loads with it - startup work has to be kept off route entry modules
deliberately (see the startup worklist in `PERF_REPORT.md`). Navigation
customisation is bounded by what the router exposes of the underlying
native-stack options.
