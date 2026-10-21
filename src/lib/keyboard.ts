import { KeyboardController } from 'react-native-keyboard-controller';

let didPreload = false;

/**
 * Preloads the keyboard once after the first keyboard surface mounts.
 * Boot-time `KeyboardProvider preload` hangs the main thread on iOS 26
 * (FOAM-TV-MOBILE-3A, kirillzyusko/react-native-keyboard-controller#1202).
 */
export function preloadKeyboardOnce() {
  if (didPreload) {
    return;
  }

  didPreload = true;
  KeyboardController.preload();
}
