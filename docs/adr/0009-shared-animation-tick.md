# One shared tick per animation domain

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
pause when the surface is scrolling or unfocused**. On Android the "one tick"
is the supervising Choreographer clock - per-frame stepping stays on the
decoder library's worker threads by necessity, but phase is still a pure
function of the one epoch. Alternatives already tried and rejected: per-view
animation (phase drift and frame-0 restarts) and a 15fps frame-coalescing
variant of the driver (reverted - capping the provider's frame count broke
animations; the 30fps display-link cap is the correct knob).

Note for reviewers: no module named `SyncedAnimationCoordinator` exists
anywhere in the tree - the names above are the real ones, and both native
drivers are invisible to a grep of `src/` because they live in the patch
file.

**Native animated emotes (Android)** - `SharedAnimationDriver.kt`, a
Choreographer-supervised phase lock in the same expo-image patch (compiled
only because `^expo-image$` is in `expo.autolinking.android.buildFromSource`;
without that entry the RNRepo prebuilt AAR ships and the patch silently does
nothing). The iOS per-tick frame seek does not port: penfeizhou's
`FrameSeqDecoder` composes delta-encoded frames sequentially into one buffer
on its own worker thread, so external seeking corrupts pixels and a faithful
port would mean reimplementing the decode loop. Instead the driver keeps the
same global epoch and phase-locks with the public API: each animated
drawable's `reset()` (a live restart-from-frame-0 that keeps decode state) is
scheduled to land on its next epoch loop boundary, after which loop position
is a function of the shared clock; a coarse Choreographer callback measures
drift and re-aligns only past a tolerance, so an in-phase animation is never
visibly restarted. The same patch also routes every `FrameAnimationDrawable`
(WebP/APNG, not just GIF) through pause/resume, which is what used to restart
WebP emotes from frame 0 on every scroll-fling pause and focus change.
Glide already hands one drawable instance to every view with the same cache
key, so most same-emote rows share a decoder; the epoch brings
differently-sized instances and restarted decoders into the same phase.

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
