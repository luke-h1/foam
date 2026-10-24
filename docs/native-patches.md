# Native patches, source builds and the bottom sheet

Read this before you edit `src/components/bottom-sheet/`, `patches/`, `package.json` `patchedDependencies` or `expo.autolinking.android.buildFromSource`. A grep makes some of these entries look unused. They are in use.

## Bottom sheets: `@expo/ui` plus an unreleased iOS touch fix

Every sheet goes through `src/components/bottom-sheet/bottom-sheet.native.tsx`. It wraps `@expo/ui/community/bottom-sheet`, which is a SwiftUI `.sheet` on iOS and a Material 3 `ModalBottomSheet` on Android.

Sizing is different on each platform on purpose:

- iOS gets the snap points as real `presentationDetents`. The sheet drags between them and lays itself out again on rotation, and the content flexes to fill it.
- Android's `ModalBottomSheet` has only a partial and an expanded state, so it cannot stop at a fraction such as `0.78`. The wrapper omits detents there, lets the sheet size to its content, and puts the resolved pixel height on the content view.

A flexed child inside a sheet that sizes to its content measures as zero, and the sheet shows blank. For that reason the wrapper applies `flex: 1` only when the sheet has detents.

`onDismiss` fires when the dismissal starts, not when it ends, and consumers unmount the sheet when it fires. The wrapper holds the callback until the transition ends. Without that, the native closing animation stops partway.

SDK 58's `@expo/ui` hosts RN views with corrected measurement and touch
routing ([#48969](https://github.com/expo/expo/pull/48969) and related). The
old iOS `ExpoUITouchHandlerHelper` patch from SDK 57 is no longer applied. If
emote-grid taps regress, re-check [expo/expo#48259](https://github.com/expo/expo/pull/48259)
before restoring an iOS hunk.

## Android: the `@expo/ui` and `expo-image` source builds are required

`package.json` sets `expo.autolinking.android.buildFromSource: ["^expo-image$", "^expo-ui$"]`. Each entry makes Android compile that package from source instead of using the RNRepo prebuilt, which is the only way a patch to its native code reaches the build.

- `^expo-ui$` lets `patches/@expo%2Fui@58.0.22.patch` apply. The patch adds `icon = {}` to `SegmentedButtonView.kt`. Without it, the Compose segmented control shows a checkmark that pushes the label off centre.
- `^expo-image$` lets the Android hunks of `patches/expo-image@58.0.16.patch` apply.

Nothing in `src/` imports `SegmentedButton` by name, so a grep makes the `@expo/ui` patch and its autolinking entry look unused. They are in use: `src/components/segmented-control/segmented-control.tsx` imports `@expo/ui/community/segmented-control`, and its `SegmentedControl.android.tsx` renders `SingleChoiceSegmentedButtonRow` and `SegmentedButton` from the Jetpack Compose tree. If you remove the patch or the `buildFromSource` entry, every Android segmented control shows the checkmark again.

Do not add `minSdkVersion` to the `build.gradle` of a module in `modules/`. `expo-module-gradle-plugin` already sets `minSdk` from the root project (`ProjectConfiguration.kt`). A local value would hold the module below the app the next time the app's `minSdkVersion` goes up.
