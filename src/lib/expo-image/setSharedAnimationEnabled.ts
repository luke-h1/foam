import { Platform } from 'react-native';

import { requireOptionalNativeModule } from 'expo';

/**
 * Phase-locks animated images to one shared clock, so every view of the same
 * emote sits on the same frame regardless of when each row mounted. Backed by
 * the iOS and Android `SharedAnimationDriver`s in
 * `patches/expo-image@57.0.1.patch`.
 *
 * Resolves once the driver holds the new value, so a caller that remounts to
 * pick the mode up can await this first. Remounting without it races the native
 * apply, and the new views can read the old value.
 */
export async function setSharedAnimationEnabled(
  enabled: boolean,
): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }
  const imageModule = requireOptionalNativeModule<{
    setSharedAnimationEnabled?: (enabled: boolean) => Promise<void>;
  }>('ExpoImage');
  await imageModule?.setSharedAnimationEnabled?.(enabled);
}
