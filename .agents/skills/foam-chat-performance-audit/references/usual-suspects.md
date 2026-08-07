# Usual suspects

Genuinely common in React Native hot paths and rarely fixed by default. **Check every one against the Phase 0.5 already-solved list before reporting it.**

Each entry gives the tell, why it costs, and the shape of the fix. None of these are worth reporting without a measurement attached — they are places to look, not findings.

## Rendering

### Long style arrays rebuilt per item

**Tell:** a row or cell component passes `style={[a, b, cond && c, cond2 && d, ...]}` with a dozen or more entries, several of them nested arrays or inline objects.

**Cost:** React Native flattens the array on every commit, for every visible item, including all the entries that evaluate falsy.

**Fix shape:** derive a small variant key from the boolean state, look up a pre-flattened style from a module-level map, and keep only genuinely dynamic values (a computed colour) as a second array element.

**Do not** report this as "extract styles to `StyleSheet.create`" — they usually already are. The cost is the array length, not the object identity.

### View recycling disabled

**Tell:** `recycleItems={false}`, `disableRecycling`, or an equivalent flag, often with a comment mentioning a crash or a visual glitch.

**Cost:** every visible item mounts fresh instead of being reused. Mount cost where a recycling list pays only update cost. Usually the largest single structural gap in a list.

**Fix shape:** the frontier entry is **the underlying bug**, not the flag. Reproduce the crash first — the usual causes are state held in item closures outliving the recycle, or an image/media key racing a reused cell. Then enable behind a flag and measure both ways under sustained load.

### Over-broad store subscriptions

**Tell:** a component reads a root observable, a whole slice, or a context value containing an object that changes identity often.

**Cost:** every item re-renders when any part of the store changes, regardless of relevance.

**Fix shape:** subscribe to the leaf. If the state library exposes selector granularity, use it; if the value is a context object, split the context by update frequency.

### Screens rendering while backgrounded

**Tell:** no `freezeOnBlur`, or `enableFreeze(false)` set globally, with no per-screen counterweight.

**Cost:** inactive screens keep re-rendering on every store tick. Cheap per screen, expensive when the store is a firehose.

**Fix shape:** per-screen freezing rather than a global flag. Check first whether the global disable exists for a reason — keeping a video player or socket alive across navigation is a legitimate cause.

## Threading

### Touch handling in JavaScript

**Tell:** raw `onTouchStart` / `onTouchMove` / `onTouchEnd` on a `View`, plus `setTimeout` for long-press, on a per-item component.

**Cost:** every touch event on the list crosses into JS, per item, during scroll — contending with whatever else the JS thread is doing.

**Fix shape:** move to the native gesture library if it is already a dependency. Verify the downstream interactions (context menus, jump-to-target, haptics) still fire.

### Scroll handlers on the JS thread

**Tell:** plain JS callbacks passed to `onScroll` with `scrollEventThrottle={16}`.

**Cost:** ~60 JS invocations per second during a fling, contending with state commits — the two are usually competing for the same thread at exactly the moment smoothness matters most.

**Fix shape:** `useAnimatedScrollHandler` for the per-event bookkeeping, `runOnJS` only for the transitions (entered/left bottom, drag ended). The integration risk is any ref other code reads synchronously.

### Large parses on the JS thread

**Tell:** `JSON.parse` on network payloads or storage reads in the request path.

**Cost:** blocks the JS thread proportional to payload size.

**Fix shape:** a worklet runtime or worker with a JS-thread fallback. Only worth it above a size threshold — measure the payloads first.

### Synchronous storage on a commit path

**Tell:** MMKV or similar sync APIs called inside a state update or per item.

**Cost:** disk write inside the frame.

**Fix shape:** defer, batch, or short-circuit on identity. Check whether a defer mode already exists before adding one.

## Work amplification

### Per-item work that is O(collection)

**Tell:** a lookup that scans an array rather than hitting a map, inside a per-item function.

**Cost:** multiplies with both item count and collection size. Invisible at small scale, quadratic at large.

### Cache keys with unstable references

**Tell:** a cache key built from an object or array identity that is recreated each render.

**Cost:** the cache never hits, so it is pure overhead — worse than no cache. Verify hit rate before assuming a cache works.

### Handlers that allocate proportional to viewport

**Tell:** a viewability or scroll callback that maps over visible items and joins them into a string, usually to compare against the previous value.

**Cost:** repeated allocation at scroll frequency.

**Fix shape:** compare a running hash, or a first-key / last-key / length triple.

### Shared metadata invalidating everything

**Tell:** an update to a lookup table (user colours, emotes, badges, formatting rules) triggers recomputation across every item.

**Cost:** one inbound event costs far more than the item that triggered it. Frequently the real cause when jank correlates with activity but not with rendering.

**Fix shape:** version the metadata and recompute lazily per item on read, rather than eagerly across the collection on write.

## Growth

### Listeners and timers without teardown

**Tell:** subscriptions registered in effects with incomplete cleanup, or in module scope.

**Cost:** grows with session length and channel/room switches. Shows as gradual degradation nobody can reproduce in a short session.

### Caches with no eviction or memory-pressure participation

**Tell:** a `Map` that only ever grows, or a cache that does not respond to native memory warnings.

**Cost:** eventual eviction of something more important by the OS, or termination.

**Fix shape:** bounded size with LRU, plus participation in whatever memory-pressure mechanism the app already has. Check for an existing one before adding a second.

## Patterns this repo actually hit (added 2026-08-07)

### Dead guards duplicating library-internal work

**Tell:** a handler diffs its input against the previous value (joined key strings, deep compares) before acting.

**Cost:** the allocation runs on every event; meanwhile the library already performed the same diff before invoking the callback, so the guard never fires - or the app's key scheme (e.g. embedding a dense array index) guarantees a mismatch, so it fires always. Either way it is pure overhead.

**Fix shape:** read the installed library source; if the upstream diff exists, **delete** the guard rather than cheapening it.

### Config options whose semantics changed under you

**Tell:** a config value with a comment describing what it does ("skip churn for rows that flash past").

**Cost:** the comment describes some version of some library. The installed implementation may do something else entirely - a "minimum view time" implemented as an unconditional delay timer per scroll tick adds work instead of removing it.

**Fix shape:** verify every load-bearing config option against `node_modules` source at the installed version before trusting it in a ledger.

### Heavyweight design-system primitives in hot rows

**Tell:** the app's general-purpose `Text`/`Box` wrapper used for every span of a high-frequency row.

**Cost:** wrapper conveniences (theme resolution, recursive style-array walks, margin props) are priced per span, and the compiler's per-instance memo cache (`_c(n)`) is allocated per mount - with recycling off, at item-arrival rate. Callers passing fresh style-array identities defeat the wrapper's own memoisation.

**Fix shape:** a surface-local primitive over the raw native component with pre-resolved styles, or interned style tuples so the wrapper's memo hits.

### Scroll-shed that unmounts expensive native subtrees

**Tell:** rows swap an expensive native stack (masked views, SVG, canvases) for a cheap placeholder while a scroll-active flag is set.

**Cost:** the expensive part of those views is creation and first offscreen composite - unmount-on-fling pays it again on every settle, for every affected row. The shed also fans out a synchronous re-render burst exactly at fling start.

**Fix shape:** keep the subtree mounted and toggle opacity/visibility, or replace the stack with a renderer cheap enough not to shed.

### Caches keyed per-user for per-asset work

**Tell:** an LRU whose key includes the username/instance for a value that is mostly shared (same cosmetic worn by many users).

**Cost:** capacity thrash in busy rooms; misses re-run multi-surface rasterisation synchronously during render.

**Fix shape:** split the key - share the identity-independent layers, keep only the glyph-dependent part per user.

### Object spread chains between pipeline stages

**Tell:** each stage does `{...msg, oneMoreField}`; somewhere a field is added then `delete`d.

**Cost:** N full copies per item (7 was the observed count), and `delete` on a fresh spread forces Hermes dictionary mode for that object and everything spread from it. Worse: cloning parts before store commit destroys the object identity that downstream WeakMap caches key on, so those caches never hit again.

**Fix shape:** construct the final shape once at parse time and once at commit time; carry flags as stable booleans or in a side WeakSet; never clone a cached array on the way to the store.

## Reporting rules for everything above

- Nothing here is a finding until it has a number. They are search locations.
- If Phase 0.5 shows it is handled, it is not a finding, even if the code looks wrong.
- If the code looks wrong and Phase 0.5 does not cover it, measure it before writing it up.
- If it measures as free, say so. "Checked and it costs nothing" is a useful audit result.
