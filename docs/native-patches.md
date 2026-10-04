# Native patches, source builds and the bottom sheet

Read this before you edit `src/components/bottom-sheet/`, `patches/`, `package.json` `patchedDependencies` or `expo.autolinking.android.buildFromSource`. A grep makes some of these entries look unused. They are in use.

## Bottom sheets: `@expo/ui` plus an unreleased iOS touch fix

Every sheet goes through `src/components/bottom-sheet/bottom-sheet.native.tsx`. It wraps `@expo/ui/community/bottom-sheet`, which is a SwiftUI `.sheet` on iOS and a Material 3 `ModalBottomSheet` on Android.

Sizing is different on each platform on purpose:

- iOS gets the snap points as real `presentationDetents`. The sheet drags between them and lays itself out again on rotation, and the content flexes to fill it.
- Android's `ModalBottomSheet` has only a partial and an expanded state, so it cannot stop at a fraction such as `0.78`. The wrapper omits detents there, lets the sheet size to its content, and puts the resolved pixel height on the content view.

A flexed child inside a sheet that sizes to its content measures as zero, and the sheet shows blank. For that reason the wrapper applies `flex: 1` only when the sheet has detents.

`onDismiss` fires when the dismissal starts, not when it ends, and consumers unmount the sheet when it fires. The wrapper holds the callback until the transition ends. Without that, the native closing animation stops partway.

`patches/@expo%2Fui@57.0.13.patch` carries [expo/expo#48259](https://github.com/expo/expo/pull/48259), which is still open upstream. On iOS, `RNHostView` hosts the sheet content. Without the patch, a hosted `Pressable` drops `onPress` when the finger moves at all ([#48131](https://github.com/expo/expo/issues/48131)). The emote grid rows find the tapped emote from `locationX`, so the grid is then almost impossible to tap.

The patch needs `expo-modules-core` 57.0.8 or later, because `ExpoViewShadowNode.h` reads the `layoutRoot` prop that the patch adds. Upstream fixed the Android half of the same bug in `@expo/ui` 57.0.8. Remove the iOS hunks when the PR ships.

## Android: the `@expo/ui` and `expo-image` source builds are required

`package.json` sets `expo.autolinking.android.buildFromSource: ["^expo-image$", "^expo-ui$"]`. Each entry makes Android compile that package from source instead of using the RNRepo prebuilt, which is the only way a patch to its native code reaches the build.

- `^expo-ui$` lets `patches/@expo%2Fui@57.0.13.patch` apply. The patch adds `icon = {}` to `SegmentedButtonView.kt`. Without it, the Compose segmented control shows a checkmark that pushes the label off centre.
- `^expo-image$` lets the Android hunks of `patches/expo-image@57.0.3.patch` apply.

Nothing in `src/` imports `SegmentedButton` by name, so a grep makes the `@expo/ui` patch and its autolinking entry look unused. They are in use: `src/components/segmented-control/segmented-control.tsx` imports `@expo/ui/community/segmented-control`, and its `SegmentedControl.android.tsx` renders `SingleChoiceSegmentedButtonRow` and `SegmentedButton` from the Jetpack Compose tree. If you remove the patch or the `buildFromSource` entry, every Android segmented control shows the checkmark again.

Do not add `minSdkVersion` to the `build.gradle` of a module in `modules/`. `expo-module-gradle-plugin` already sets `minSdk` from the root project (`ProjectConfiguration.kt`). A local value would hold the module below the app the next time the app's `minSdkVersion` goes up.
