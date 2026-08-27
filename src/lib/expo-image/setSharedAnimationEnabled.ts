import { Platform } from 'react-native';

import { requireOptionalNativeModule } from 'expo';

/**
 * Phase-locks animated images to one shared clock (patches/expo-image@57.0.1.patch).
 * Resolves once the driver holds the value - remounting earlier races the native apply.
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
