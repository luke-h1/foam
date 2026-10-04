# Native patches, source builds and the bottom sheet

Read this before you edit `src/components/bottom-sheet/`, `patches/`, `package.json` `patchedDependencies` or `expo.autolinking.android.buildFromSource`. Some of these entries look dead to a grep and are not.

## Bottom sheets: `@expo/ui` plus a not-yet-released iOS touch fix

Every sheet goes through `src/components/bottom-sheet/bottom-sheet.native.tsx`, which wraps `@expo/ui/community/bottom-sheet`: a SwiftUI `.sheet` on iOS, a Material 3 `ModalBottomSheet` on Android.

Sizing differs per platform on purpose. iOS gets the snap points as real `presentationDetents`, so the sheet drags between them and re-lays out on rotation by itself, and the content flexes to fill. Android's `ModalBottomSheet` has only a partial and an expanded state, so a fraction like `0.78` has nowhere to land; there the wrapper omits detents, lets the sheet size to its content, and puts the resolved pixel height on the content view. A flexed child under fit-to-content measures as zero and the sheet presents blank, so `flex: 1` is applied only on the detented path.

`onDismiss` fires when the dismissal starts, not when it finishes, and consumers unmount the sheet on it. The wrapper holds the callback for the length of the transition; without that the native outro is cut off partway.

`patches/@expo%2Fui@57.0.13.patch` carries [expo/expo#48259](https://github.com/expo/expo/pull/48259), which is still open upstream. Sheet content is hosted in `RNHostView` on iOS, and without the patch a hosted `Pressable` drops `onPress` on any finger movement ([#48131](https://github.com/expo/expo/issues/48131)). That makes the emote grid close to untappable, since its rows resolve the tapped emote from `locationX`. The patch also needs `expo-modules-core` >= 57.0.8, where `ExpoViewShadowNode.h` consumes the `layoutRoot` prop it adds. Drop the iOS hunks once the PR ships; the Android half of the same bug is already fixed in 57.0.8.

## Android: the `@expo/ui` source build is load-bearing

`package.json` sets `expo.autolinking.android.buildFromSource: ["^expo-image$", "^expo-ui$"]`. The `^expo-ui$` entry forces `@expo/ui` to compile from source on Android instead of resolving the RNRepo prebuilt. That entry exists so `patches/@expo%2Fui@57.0.13.patch` actually lands - the patch adds `icon = {}` to `SegmentedButtonView.kt`, without which the Compose segmented control renders a checkmark that shunts the label off-centre.

Nothing in `src/` imports `SegmentedButton` by name, so a grep makes both the patch and the autolinking entry look dead. They are not: `src/components/segmented-control/segmented-control.tsx` imports `@expo/ui/community/segmented-control`, whose `SegmentedControl.android.tsx` renders `SingleChoiceSegmentedButtonRow` / `SegmentedButton` from the jetpack-compose tree. Removing either the patch or the `buildFromSource` entry silently regresses every Android segmented control.

The `^expo-image$` entry exists for the same reason: without it `patches/expo-image@57.0.3.patch` never reaches the Android build.

Do not add `minSdkVersion` to the `build.gradle` of a module in `modules/`. `expo-module-gradle-plugin` already sets `minSdk` from the root project (`ProjectConfiguration.kt`), so a local value would pin the module below the app the next time the app's `minSdkVersion` moves.
