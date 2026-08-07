# Phase 0 — Deriving the repo

Run these before reading any surface code. Record every answer; the rest of the audit depends on them.

## 0.1 Toolchain

```bash
ls bun.lock* package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null   # package manager
cat package.json | grep -A40 '"scripts"'                              # available commands
grep -E '"(react|react-native|expo)"' package.json                    # versions
```

Record: package manager, RN version, Expo or bare, exact script names for test / typecheck / lint / e2e.

**Use the repo's scripts.** Running `npm test` in a bun repo, or `tsc --noEmit` when the repo wraps it as `ts:check`, produces output nobody trusts and may miss project flags.

## 0.2 What the framework already handles

| Check | Command | Consequence |
| --- | --- | --- |
| React Compiler | `grep -rn "reactCompiler\|babel-plugin-react-compiler" babel.config.* app.config.* app.json package.json` | If on, manual `useMemo` / `useCallback` / `memo` findings are noise unless you can show a bailout |
| New Architecture | RN ≥ 0.76 defaults on; check `newArchEnabled` in `app.json`, `gradle.properties`, `Podfile.properties.json` | Determines what a commit costs and whether Fabric tree churn is in play |
| Hermes | `grep -rn "jsEngine" app.json app.config.* gradle.properties` | GC behaviour under high allocation |
| Metro transforms | `cat metro.config.js babel.config.js` | `inlineRequires`, custom optimisation plugins, module resolution |
| Release-only settings | `grep -rn "proguard\|shrinkResources\|enableProguard" app.config.* android/` | Debug numbers are meaningless without knowing what Release changes |

## 0.3 The surface's stack

For the surface under audit, identify:

- **List / virtualisation library and its config.** FlatList, FlashList, LegendList, custom. Note recycling on/off, draw distance, item-type hints, viewability config, and any `maintainScrollAtEnd` behaviour. Recycling disabled is a finding candidate, not a given — check *why*.
- **State library and subscription granularity.** Redux, Zustand, Legend State, Jotai, plain context. The question is not which library: it is whether components subscribe to leaves or to roots.
- **Data ingress.** WebSocket, SSE, polling, native events. What runs per inbound frame, and whether anything gates admission.
- **Animation.** Reanimated worklets, Animated with native driver, JS-driven, none. Whether the animation path touches the JS thread during interaction.
- **Patched dependencies.** `ls patches/ 2>/dev/null`. A patch changes upstream behaviour; any finding inside a patched package must state whether the patch is implicated.

## 0.4 Existing instrumentation

```bash
grep -rn "perf\|profil\|bench\|reassure\|instrument\|signpost\|trace" \
  package.json .github/workflows/ scripts/ 2>/dev/null | head -40
find . -name "*.perf-test.*" -not -path "./node_modules/*"
find . -path "*dev-tools*" -o -path "*devtools*" -not -path "./node_modules/*" | head -20
```

Most teams that care have already built harnesses. **Use theirs before building your own** — their numbers are what CI compares against, and a parallel measurement nobody trusts is worthless.

Record:

- Harness commands and what each measures (JS render cost vs native frame time are different questions)
- On-device debug routes and how they are gated by build variant
- Perf CI workflows and what triggers them
- **Platform asymmetry.** Native tracing modules are frequently iOS-only. If the repo has an `os_signpost` bridge with no Android counterpart, Android evidence has to come from Perfetto and the trace regions will be unnamed. Never present an iOS number as an Android number.

## 0.5 The already-solved list

The step that separates an audit from slop.

```bash
git log --oneline --grep="perf\|slow\|jank\|fps\|optimi" | head -40
git log --oneline -S"performance" -- <surface-path> | head -30
git log --oneline -S"cache" -S"debounce" -S"throttle" -- <surface-path> | head -20
```

Then read the surface for the tells:

- Caches, and what their keys are made of
- Buffers, coalescing intervals, flush cadences
- Debounces, throttles, rate limiters, admission gates
- Commit caps and batch-size limits
- Deferred work — `startTransition`, `InteractionManager`, idle callbacks
- Worklet or worker offloading
- Memoisation that predates the compiler

**Comments carry more signal than code here.** A constant with a paragraph above it explaining why it is 100 and not 50 is a decision someone already measured, usually against a bug number. Treat it as settled unless you have a number that contradicts it. Chasing a "magic number" that has a rationale comment is the most common way an audit wastes everyone's time.

Write the result out explicitly:

> Already handled: per-item parse cached by content hash (1000 entries); arrivals coalesced at 100ms because dead shadow trees dominated GC (issue #594); commit capped per flush, lower on Android; scrollback capped at 150.

Everything on that list is forbidden output for the rest of the audit.

## Recording the derivation

Keep it in the report so the next person can tell whether it has gone stale:

```json
{
  "derivedAt": "2026-08-07",
  "toolchain": { "pm": "bun", "rn": "0.86.2", "expo": true },
  "framework": { "reactCompiler": true, "newArch": true, "hermes": true },
  "surface": {
    "list": "LegendList v3, recycling disabled",
    "state": "Legend State, leaf subscriptions",
    "ingress": "WebSocket",
    "animation": "Reanimated 4 + worklets"
  },
  "harnesses": ["perf:chat:rn", "perf:chat:ios", "test:perf"],
  "platformAsymmetry": "signpost module is iOS-only",
  "alreadySolved": ["parse cache", "100ms coalescing (#594)", "commit cap", "scrollback cap"]
}
```
