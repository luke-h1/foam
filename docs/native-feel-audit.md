# Native feel audit: Foam against Rainbow

This audit compares how navigation and touch feedback feel in Foam and in
[Rainbow](https://github.com/rainbow-me/rainbow). It lists the gaps a user can
see or feel, ranks them, and records what changed for each one.

- Rainbow commit studied: `e406e093f1b7afbd212023dcc52e14d6a3bce230`
  (2026-10-14).
- Foam base: `4fb7a4b7` on `main`.

Rainbow is GPL-3.0. The notes below describe mechanisms in our own words. No
Rainbow code is copied into this file or into Foam.

## How Rainbow does it

Rainbow is iOS-first. It runs React Navigation 6 with a JavaScript stack and
puts native work on top.

- **Navigation.** On iOS the root is a native modal stack that Rainbow vendors
  as `react-native-cool-modals`. It wraps a fork of Slack's PanModal. Below
  it, a JavaScript stack (`@react-navigation/stack`) holds the main screens.
  On Android, a custom navigator built on `@gorhom/bottom-sheet` holds the
  sheets and a JavaScript stack holds the cards. The cards open with a spring
  that has no bounce and close with a slower spring, and they can be dragged
  down from anywhere on the card.
- **Tabs.** A material-top-tabs navigator with swiping and animation turned
  off and a custom floating tab bar. The selection pill moves with a stiff
  spring on the frame of the tap, before the tab changes. Every tab press
  fires a selection haptic. A press on the current tab scrolls it to the top.
- **Sheets.** On iOS, PanModal sheets have short and long heights, a dim that
  follows the drag, tap-outside to dismiss, and top corners that match the
  device screen radius (read from a private UIKit key). Most sheets use a
  spring with no bounce over 0.25 to 0.3 s. A coordinator queues a new sheet
  until the closing one has finished, and blocks double taps for 200 ms.
- **Corners.** Smooth corners come from `borderCurve: 'continuous'`. The
  squircle library is used in one Skia component only.
  `react-native-screen-corner-radius` sizes a few full-height cards to the
  device radius. No screen scales back behind a sheet.
- **Menus.** Three libraries, but only two native engines. One wrapper uses
  `UIMenu` on iOS and `PopupMenu` on Android, opened by a tap. `zeego` sits
  on top of the same two. No menu shows a lifted preview.
- **Haptics.** A selection haptic when a button is released, not on touch
  down. Success, warning and error haptics on outcomes, including every copy
  to the clipboard. Threshold haptics on sliders. There is no user setting
  to turn haptics off.
- **Press feedback.** A native button view scales its content to 0.86 by
  default (0.96 on list rows) over 160 ms with an ease-out-quad curve. The
  animation runs in UIKit or in the Android view, so the JavaScript thread
  never takes part and React state never changes.
- **Touch delay.** Rainbow patches `react-native-gesture-handler` so that
  scroll views it wraps do not hold touches back for about 150 ms on iOS.
  On Android, the patch stops phantom presses while a list scrolls.
- **Blur.** A fork of `react-native-blur-view` that uses a private API for a
  variable blur. It is iOS-only, and its own README warns about App Store
  rejection.
- **Keyboard.** `react-native-keyboard-controller`. Footers move with the
  keyboard frame by frame, with offsets of 6 to 20 pt above the safe area.

## Gaps, ranked

The rank is impact divided by effort (S = 1, M = 2, L = 3). Rows with medium
or high risk to chat or playback come last, whatever their score.

| #   | Primitive                                 | Rainbow mechanism                                                                                                      | Foam today (paths)                                                                                                                                                                                                                                    | Expo Router / native-stack option that gets close                                                                                                   | Gap you can see or feel                                                                                                                                                                                                                                                    | Effort | Impact             | Risk to chat/playback                                                                                                                 |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Press timing                              | Native scale over 160 ms with an ease-out curve                                                                        | `src/providers/providers.tsx` `PressablesConfig` sets only `minScale` 0.97. `pressto` then uses its default: 250 ms with the CSS `ease` curve                                                                                                         | Not a navigator concern. `PressablesConfig` takes `animationType` and `animationConfig`                                                             | A normal tap lasts about 100 ms. With a 250 ms curve that starts slowly, the button is released before it has visibly shrunk, so taps on cards and buttons feel unacknowledged. `DESIGN.md` and `motion.ts` already ask for 110 ms (`motion.instant`)                      | S      | 4                  | Low. The composer buttons use `PressableScale`, but the change is visual only                                                         |
| 2   | Row press state                           | Press state never reaches React                                                                                        | `src/components/pressable-area/pressable-area.tsx` calls `setPressed` on press-in and press-out. It has 14 call sites, including compact `LiveStreamCard` rows in the Top, Following and Search lists, the chatters sheet and the saved phrases sheet | Not a navigator concern. Drive the dim and highlight from a Reanimated shared value. `pressto` already has `createAnimatedPressable`                | A row lights up only after a React render. Each press re-renders the row twice, and the highlight lands late when the JavaScript thread is busy                                                                                                                            | S      | 4                  | Low. It removes renders from two chat sheets and adds none                                                                            |
| 3   | Header material on iOS 16.4 to 18         | Blur material under the bars                                                                                           | `src/utils/navigation/native-stack-options.ts` sets `headerTransparent` on iOS with no `headerBlurEffect`                                                                                                                                             | `headerBlurEffect: 'systemChromeMaterialDark'` when `isLiquidGlassAvailable()` is false. The tab bar already does this (`src/app/tabs/_layout.tsx`) | On iOS 18 and earlier the collapsed nav bar has no background. Titles and the back button sit straight on top of thumbnails while you scroll. iOS 26 adds its own scroll-edge effect. Check on an iOS 18 simulator before the change                                       | S      | 3                  | None                                                                                                                                  |
| 4   | Sheet corners on iOS 26                   | Full-height sheets use the device screen radius                                                                        | `auth-sheet`, `feedback` (`src/components/root-layout/root-layout-nav.tsx`) and `clip` (`src/app/streams/_layout.tsx`) pin `sheetCornerRadius` to 28. The `@expo/ui` sheets set no radius and already follow the system                               | Leave out `sheetCornerRadius` when `isLiquidGlassAvailable()`. Keep 28 below iOS 26                                                                 | On iOS 26 a floating form sheet's corners follow the display's curve. A fixed 28 pt overrides that, so the sheet's bottom corners do not line up with the corners of the phone. Check on a device before the change                                                        | S      | 2                  | None. The clip sheet only plays a clip                                                                                                |
| 5   | Copy haptic                               | Success haptic with every copy toast                                                                                   | Copy actions show a toast with no haptic: `src/components/chat/hooks/use-chat-overlay-handlers.ts` (message, username), `emote-preview-sheet.tsx`, `badge-preview-sheet.tsx`                                                                          | Not a navigator concern. `notification('success')` already exists in `src/lib/haptics.ts`                                                           | Copying a message, a username or an emote shows a toast but the phone does not respond. `DESIGN.md` "Haptics" needs a line for copy if you agree                                                                                                                           | S      | 2                  | Low. These are user actions in overlay handlers, not on the ingest path                                                               |
| 6   | Menus opened by a button (iOS)            | Tap opens a native `UIMenu` anchored to the button                                                                     | The sleep timer (`src/screens/stream/util/show-sleep-timer-menu.ts`, opened from a button on the live and VOD screens) goes through `showActionMenu`, which calls `ActionSheetIOS` on iOS                                                             | `@expo/ui/swift-ui` `Menu`, already used by `stream-list-layout-menu.ios.tsx`                                                                       | Tapping the sleep timer button slides an action sheet up from the bottom of the screen, away from the button. Other iOS buttons open a menu next to the button                                                                                                             | S      | 2                  | Medium. The button sits in the player screens. The change is a menu, not playback code                                                |
| 7   | Long-press on content (iOS)               | Native menus (tap-triggered in Rainbow). The iOS idiom for long-press on content is a context menu that lifts the item | `LiveStreamCard`, `CategoryCard` and My clips rows fire `impact('medium')`, then `showActionMenu`, then `ActionSheetIOS`                                                                                                                              | `@expo/ui/swift-ui` `ContextMenu` with `Trigger`, `Items` and `Preview`. It is already a dependency, and the system plays its own haptic            | Long-pressing a stream card buzzes, then a sheet rises from the bottom. The card does not lift and the menu does not appear at the finger. Chat message long-press stays as it is                                                                                          | M      | 4                  | Medium. Each card would sit inside a SwiftUI `Host` in a FlashList row. Measure mount and scroll cost on Top before you keep it       |
| 8   | Press start on a busy JavaScript thread   | Press animation runs entirely in native code                                                                           | `pressto` gets its press-in from an RNGH `BaseButton` callback on the JavaScript thread, then sets a shared value. Row 2 removes the React render but keeps this hop                                                                                  | Not a navigator concern. Use RNGH `Gesture.Tap` with worklet callbacks, or a later `pressto` (0.7.0, MIT) if it moves press-in to the UI thread     | On the live stream screen during a busy chat, the composer and player buttons may react late to touch down. Measure this before any work: time from touch down to the first scaled frame, with `perf:chat` load                                                            | M      | 2 (until measured) | Medium. The composer buttons are in chat                                                                                              |
| 9   | Swipe-back on stream screens below iOS 26 | n/a. Rainbow uses a JavaScript stack                                                                                   | `live-stream/[id]`, `streamer-profile/[id]` and `vod/[id]` set `fullScreenGestureEnabled: true` (`src/app/streams/_layout.tsx`)                                                                                                                       | Leave the option unset. `react-native-screens` 4.26 turns on the native full-screen pop by default on iOS 26 and uses the native edge swipe below   | Below iOS 26 the full-width swipe uses a custom pan with a "simple push" animation. The screen underneath slides flat, with no parallax and no dim, unlike every other back swipe in the app. The trade-off: iOS 18 users lose the full-width swipe on these three screens | S      | 2                  | Medium. The swipe region on the live stream screen changes below iOS 26                                                               |
| 10  | Android predictive back inside the stack  | n/a. Rainbow is iOS-first                                                                                              | `predictiveBackGestureEnabled: true` in `app.config.ts`. The classic stack in `react-native-screens` 4.26 has no back-progress handler                                                                                                                | None today. Expo Router exposes no option, and the "gamma" stack in `react-native-screens` is experimental                                          | On Android, a back swipe from a pushed screen shows no preview of the screen underneath. The pop plays only after you let go. Only the back-to-home preview at the root works                                                                                              | L      | 3                  | High. It needs a native patch to `react-native-screens` (ADR-0006) and touches leaving the live stream. Defer until upstream ships it |

### Recommended order

1. Press timing (row 1)
2. Row press state (row 2)
3. Header material on iOS 16.4 to 18 (row 3)
4. Sheet corners on iOS 26 (row 4)
5. Copy haptic (row 5)
6. Long-press context menu on content (row 7)
7. Sleep timer as a native menu (row 6)
8. Measure press start under load, then decide (row 8)
9. Swipe-back on stream screens below iOS 26 (row 9)
10. Android predictive back (row 10): defer

## At parity

- **Push and pop on iOS:** native `UINavigationController`. On iOS 26 the full-screen back swipe is native by default (ADR-0008).
- **Tabs:** `NativeTabs` with Liquid Glass on iOS 26 and an opaque material below it. Reselect pops to root and scrolls to top on both platforms.
- **Sheets:** `@expo/ui` gives SwiftUI detents, the native drag to dismiss, the system dim and the system corner radius on iOS. Android gets Material 3 `ModalBottomSheet` with predictive back.
- **Squircles:** every rounded rectangle sets `borderCurve: 'continuous'` (`DESIGN.md`). Rainbow uses its squircle library in one place only.
- **Haptics module:** one wrapper with a preference gate. It covers outcomes (follow, feedback, mentions) and selection changes. Rainbow has no preference gate.
- **Keyboard:** `KeyboardProvider`, a `KeyboardStickyView` composer, a swipe-down composer dismiss and `on-drag` dismiss on lists.
- **Touch delay in lists:** Foam lists use the React Native `ScrollView`, which already sets `delaysContentTouches = NO`. Foam wraps no scroll view in RNGH, so Rainbow's RNGH patch has nothing to fix here.
- **Double taps and prefetch:** `pushRouteOnce` guards pushes. Cards prefetch the route and seed the query cache on press-in, which is earlier than Rainbow's prefetch at dispatch.
- **Android ripples:** a 12% white Material ripple on `PressableArea`, `Button` and the tab bar.
- **Blur and glass:** `GlassView` on iOS 26 with a `BlurView` fallback, and system materials on the tab bar.

## Rainbow mechanisms not adopted

- **JavaScript stack with custom springs:** the native stack is closer to native, and ADR-0008 keeps it.
- **PanModal fork (`react-native-cool-modals`):** system sheets replace it, with a native side that Foam does not have to carry.
- **Private-API variable blur fork:** App Store risk, iOS-only, and system materials cover Foam's surfaces.
- **Reading the display corner radius through a private key:** on iOS 26 the system makes sheet corners follow the display (row 4).
- **Selection haptic on every tab press:** neither the iOS tab bar nor the Material navigation bar does this, and Foam follows each platform.
- **Router patch that removes a screen under the top one:** no Foam flow needs it.
- **RNGH Android touch-handling patch:** Foam does not patch RNGH and has no report of phantom presses while scrolling. Revisit if one appears.
- **Pager-view offscreen limit patch:** Foam has no swipeable pager tabs.
- **`@gorhom/bottom-sheet` on Android:** Material 3 `ModalBottomSheet` is the Android idiom, and Foam already uses it.

## Change log

Add one note per primitive as it lands: what changed, the before and after
measurement, and anything left out and why.
