import { Platform } from 'react-native';

import { requireOptionalNativeModule } from 'expo';

/**
 * Phase-locks animated images to one shared clock, so every view of the same
 * emote sits on the same frame regardless of when each row mounted. Backed by
 * `SharedAnimationDriver` in `patches/expo-image@57.0.1.patch`
 */
export function setSharedAnimationEnabled(enabled: boolean): void {
  if (Platform.OS !== 'ios') {
    return;
  }
  const imageModule = requireOptionalNativeModule<{
    setSharedAnimationEnabled?: (enabled: boolean) => void;
  }>('ExpoImage');
  imageModule?.setSharedAnimationEnabled?.(enabled);
}
