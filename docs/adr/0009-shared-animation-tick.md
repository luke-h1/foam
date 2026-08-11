# One shared tick per animation domain; Android parity is an open gap

Animated chat content is driven by exactly two tick sources, one per domain,
and never by per-view timers:

- **Native animated emotes (iOS)** - `SharedAnimationDriver`, a Swift
  singleton holding one `CADisplayLink` and a global epoch, introduced by
  `patches/expo-image@57.0.1.patch` (ADR-0006). Every animated expo-image view
  derives its frame index from the shared epoch, so newly mounted and recycled
  rows join mid-phase instead of restarting at frame 0; frame rate is capped
  at 30fps with decode budgets. Views deregister on unmount/recycle.
- **Skia paint animation (JS)** - `sharedPaintAnimationFrames.ts`
  (`components/ChatMessage/CosmeticUsername/util/`): one clock and one decode
  per paint URL, held in a module-level map of SharedValues. Subscribing rows
  each register a Reanimated `useFrameCallback`, and the first to observe a
  frame advances the shared clock - the invariant is one clock+decode per
  URL, not one frame callback total. It pauses during scroll flings via
  `chatScrollActiveShared` and resumes after settle.

The invariant: **one tick source, N subscribers, deregistration on recycle,
pause when the surface is scrolling or unfocused**. Alternatives already
tried and rejected: per-view animation (phase drift and frame-0 restarts) and
a 15fps frame-coalescing variant of the driver (reverted - capping the
provider's frame count broke animations; the 30fps display-link cap is the
correct knob).

Note for reviewers: no module named `SyncedAnimationCoordinator` exists
anywhere in the tree - the names above are the real ones, and the iOS driver
is invisible to a grep of `src/` because it lives in the patch file.

**Android has no shared tick.** Animated emotes run on stock Glide, which
restarts each emote from frame 0 on resume and shares no phase across views.
That is a recorded gap (`PERF_REPORT.md` "Android synced-animation driver"),
not a decision - a Choreographer-based port of the driver is the accepted
future shape, and per ADR fixed point "platform parity is part of the
Interface" the gap should not be normalised by new code assuming iOS-only
behaviour.

## Consequences

The emote tick's implementation can only be changed by editing the expo-image
patch, so it is pinned to that package version and must be re-carried on
upgrade. Two tick domains must keep their pause policies in agreement (both
respect scroll activity today); a third animation surface must subscribe to
one of these drivers, not add a timer.
