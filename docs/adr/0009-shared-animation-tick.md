# One shared tick per animation domain

Animated chat content is driven by one shared tick per domain, one domain per
platform where the domain is native, and never by per-view timers:

- **Native animated emotes (iOS)** - `SharedAnimationDriver`, a Swift
  singleton holding one `CADisplayLink` and a global epoch, introduced by
  `patches/expo-image@57.0.1.patch` (ADR-0006). Every animated expo-image view
  derives its frame index from the shared epoch, so newly mounted and recycled
  rows join mid-phase instead of restarting at frame 0; frame rate is capped
  at 30fps with decode budgets. Views deregister on unmount/recycle.
- **Native animated emotes (Android)** - `SharedAnimationDriver.kt`, a
  Choreographer-supervised phase lock in the same patch. It holds the same
  kind of global epoch, but cannot seek per tick the way iOS does:
  penfeizhou's `FrameSeqDecoder` composes delta-encoded frames sequentially
  into one buffer on its own worker thread, so external seeking corrupts
  pixels. It phase-locks through the public API instead, scheduling each
  drawable's `reset()` (a live restart from frame 0 that keeps decode state)
  onto its next epoch loop boundary; a coarse Choreographer callback measures
  drift afterwards and re-aligns only past a tolerance, so an in-phase
  animation is never visibly restarted. The patch also routes every
  `FrameAnimationDrawable` through pause/resume rather than only `GifDrawable`,
  which is what restarted WebP emotes from frame 0 on each scroll-fling pause.
  This half of the patch compiles only because `^expo-image$` is in
  `expo.autolinking.android.buildFromSource`; without that entry the RNRepo
  prebuilt AAR ships and the patch silently does nothing.
- **Skia paint animation (JS)** - `sharedPaintAnimationFrames.ts`
  (`components/ChatMessage/CosmeticUsername/util/`): one clock and one decode
  per paint URL, held in a module-level map of SharedValues. Subscribing rows
  each register a Reanimated `useFrameCallback`, and the first to observe a
  frame advances the shared clock - the invariant is one clock+decode per
  URL, not one frame callback total. It pauses during scroll flings via
  `chatScrollActiveShared` and resumes after settle.

The invariant: **one tick source, N subscribers, deregistration on recycle,
pause when the surface is scrolling or unfocused**. Android meets it through
supervision rather than stepping, since the decoder library owns the frame
loop, but phase there is still a pure function of the one epoch.
Alternatives already tried and rejected: per-view
animation (phase drift and frame-0 restarts) and a 15fps frame-coalescing
variant of the driver (reverted - capping the provider's frame count broke
animations; the 30fps display-link cap is the correct knob).

Note for reviewers: no module named `SyncedAnimationCoordinator` exists
anywhere in the tree - the names above are the real ones, and both native
drivers are invisible to a grep of `src/` because they live in the patch
file.

## Consequences

The emote tick's implementation can only be changed by editing the expo-image
patch, so it is pinned to that package version and must be re-carried on
upgrade - on Android that includes keeping `^expo-image$` in
`buildFromSource`, and the Android build pays the source compile for it. Two
tick domains must keep their pause policies in agreement (both respect scroll
activity today); a third animation surface must subscribe to one of these
drivers, not add a timer. The Android driver aligns by restarting a loop at
its boundary, so an animation with a finite loop count can be replayed by a
re-alignment; chat emotes loop forever, and any surface that shows
finite-loop animations should keep them off the driver.
