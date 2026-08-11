# TrueSheet migration + risk audit

2026-07-13. Chat bottom sheets moved from `@swmansion/react-native-bottom-sheet@0.14.1` (bun-patched for the FOAM-TV-MOBILE-1F rotation crash) to `@lodev09/react-native-true-sheet@3.11.6`.

## What changed

- `src/components/BottomSheet/BottomSheet.native.tsx` reimplemented on TrueSheet. Wrapper API unchanged (`isPresented` / `onDismiss` / `snapPoints` / `enableFixedSnapPoints` / `showDragIndicator` / `testID`), so none of the 9 chat sheet consumers were touched.
  - No fixed snap points -> `detents={['auto']}` (ActionSheet, UserActionSheet, EmoteActionSheet - same content-sized behavior as before).
  - `{ fraction }` -> fractional detent (native handles rotation), `{ height }` -> pixel detent, `'full'` -> `1`.
  - iOS 26+: no background props -> native Liquid Glass (replaces our GlassView emulation). iOS < 26: `backgroundBlur='dark'` + dark tint. Android: solid `surfaceSunken.dark`.
  - JS drag-indicator pill kept (native grabber disabled) for exact visual parity and layout spacing.
- Deleted: `BottomSheetProvider.{native.,}tsx`, `BottomSheetSurface.tsx`, provider usage in `Providers.tsx` / `Providers.web.tsx`, the provider jest mock, the SWM dep and its patch.
- Added bun patch `patches/@lodev09%2Freact-native-true-sheet@3.11.6.patch` (see finding 1).
- Version pinned exactly (`3.11.6`) because the patch is version-keyed and the lib ships multiple releases per week.

## Architecture facts (v3.11.6)

- iOS: native `UISheetPresentationController`. Android: Material `BottomSheetBehavior` in a CoordinatorLayout. Fabric-only (RN >= 0.76); we are on RN 0.86 / Expo SDK 56 - supported (lib's own example runs SDK 56).
- Max 3 detents; ours are all single-detent.
- All heavy peer deps (`reanimated`, `worklets`, `@react-navigation/core`, radix) are `optional: true`; radix is web-only, reanimated only for the optional `ReanimatedTrueSheet` integration.
- Built-in react-native-screens observer: sheet auto-dismisses when its presenting screen disappears and re-presents on return. (The optional RNS "keep visible under pushed screen" patch is NOT needed for our usage.)
- Xcode 26.1+ required for full iOS 26 behavior (EAS `"image": "latest"`).
- Maintenance: single maintainer, very fast release cadence (60+ releases in 7 months), aggressive stale-bot - treat "closed" != "fixed".

## Findings, ranked

1. **Unmount-while-presented is unsupported (fixed here via patch).** Maintainer wontfix ([#395](https://github.com/lodev09/react-native-true-sheet/issues/395)): the blessed model is keep-mounted + imperative present/dismiss. Our overlay layer unmounts a sheet instantly when an action is tapped. On iOS, teardown dismissal lives only in `dealloc`, and RN 0.86's Fabric recycle pool (1024 views) defers `dealloc` indefinitely -> stuck frozen sheet. Two defenses shipped:
   - Wrapper: layout-effect cleanup calls `dismiss(false)` best-effort before teardown (also restores the old instant-close UX).
   - Bun patch: `+ (BOOL)shouldBeRecycled { return NO; }` on `TrueSheetView` forces prompt `dealloc` -> the library's own snapshot-animated dismissal path runs even if the JS command loses the race. Android is already safe (`onDropInstance` dismisses synchronously).
   Long-term: if we ever want animated close on action taps, refactor the overlay layer to two-phase close (dismiss, unmount on `onDidDismiss`); the patch would then be belt-and-braces only.
2. **iOS 26 dimming/margins at non-large detents** ([#732](https://github.com/lodev09/react-native-true-sheet/issues/732), closed NOT_PLANNED as "iOS behavior"). On iOS 26, sheets at non-large detents get ~4% side margins and the reporter saw the dimming view render transparent. All our detents are non-large (0.78 / 0.9 / auto). Old SWM sheet drew its own 0.42 scrim, so a missing dim would be a visible regression over the stream. **Verify on an iOS 26 device**; fallback is `ReanimatedTrueSheet` + `dimmed={false}` + our own animated scrim.
3. **LegendList bottom safe-area inset not applied inside sheets** ([#709](https://github.com/lodev09/react-native-true-sheet/issues/709), closed despite repro). ChattersSheet's list may need explicit bottom padding (`useSafeAreaInsets`). Check on device.
4. **Do not use the `scrollable` prop.** It breaks with `'auto'` detents by design and has an unfixed content-invisible bug after tree-wide re-renders while dismissed ([#686](https://github.com/lodev09/react-native-true-sheet/issues/686)) - exactly our theme-switch shape. Our single-detent sheets don't need it; iOS auto-detects ScrollViews.
5. **Keyboard**: RN 0.83-0.85 had an iOS snap-back bug needing an RN patch; we are on 0.86 (fixed upstream). Remaining: first tap after keyboard-open can be swallowed on Android ([#641](https://github.com/lodev09/react-native-true-sheet/issues/641), open) - affects EmoteSheet/ChattersSheet search. Mitigations if seen: `keyboardShouldPersistTaps='always'`, >= 48dp touch targets. Don't `autoFocus` TextInputs in sheets (present race).
6. **Android hardware-back during sheet teardown** throws non-fatal "Could not get native view tag" ([#718](https://github.com/lodev09/react-native-true-sheet/issues/718), open) - expect occasional Sentry noise; consider an ignore rule if it gets loud.
7. **Footer slot drops presses on real devices** ([#726](https://github.com/lodev09/react-native-true-sheet/issues/726), open, iOS <= 18). We don't use `footer`; keep it that way (or use RNGH buttons) until fixed.
8. **Rotation**: least-covered area in the tracker (Android config-change and mid-animation resize bugs were fixed in 3.7-3.11; no open iOS rotation issues). UIKit owns detent resolution on iOS, which is the structural improvement over the patched SWM crash - but device-test the exact FOAM-TV-MOBILE-1F repro (open sheet, rotate, rotate back). Note iPhone landscape (compact height) renders sheets effectively full-screen per UIKit.
9. **Stacked sheets**: supported; `dismiss()` cascades the whole stack above (3.8.0 change). Our flows close one sheet before opening the next, so no impact expected.
10. **RNGH inside sheets (Android)**: gestures need a `GestureHandlerRootView` (`flexGrow: 1`) inside the sheet. Current sheets use plain `Pressable`/native scroll, so not wired; remember this if RNGH buttons land in sheet content.
11. **Fixed-detent content collapses to zero height (fixed 2026-07-13, post-audit).** TrueSheet sizes non-scrollable content by its intrinsic Yoga height - that is the mechanism behind `'auto'` detents (`TrueSheetContainerView.contentHeight` reads the content view's Yoga frame; nothing pushes the sheet height back into the content subtree). So `flexGrow: 1` content inside a fixed-detent sheet has no bounded parent and collapses to ~0: every fixed-snap-point sheet presented visually blank (verified on-device: content view measured 21pt inside an 812pt sheet). Fix in the wrapper: content gets an explicit height - estimated from the snap point for first paint, then corrected to the exact native frame via the `position` payload on `onWillPresent`/`onDidPresent`/`onDetentChange` (`height = windowHeight - position`), re-estimated on window-height change for rotation. Same change: JS drag pill replaced with the native grabber (`grabber` prop + 20pt content clearance since the native grabber floats instead of occupying a row).

## Release requirement

New native module + removed native module + iOS pod patch -> **native build (fingerprint bump) required before the next OTA**. The `shouldBeRecycled` patch must survive EAS precompiled-modules; true-sheet builds from source (it is not an Expo precompiled package), so the pod patch applies normally.

## Device verification checklist

- [ ] Action tap in ActionSheet/UserActionSheet closes the sheet (no stuck/frozen sheet) - iOS device, several rapid cycles
- [ ] iOS 26: dimming present? side margins acceptable over the player?
- [ ] iOS < 26: blur surface looks right (tint approximation vs old BlurView+overlay)
- [ ] Rotation with sheet open (FOAM-TV-MOBILE-1F repro), both directions
- [ ] ChattersSheet list bottom padding above home indicator
- [ ] EmoteSheet search: keyboard up, tap emote (first-tap swallow, Android)
- [ ] EmoteActionSheet -> EmotePreviewSheet flow
- [ ] Swipe-dismiss vs scrim-tap dismiss on both platforms
