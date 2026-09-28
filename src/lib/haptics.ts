import { Platform } from 'react-native';
import { Presets } from 'react-native-pulsar';

import { getPreferences } from '@app/store/preference-store';

function hapticsEnabled(): boolean {
  // There is no haptics engine on web, so every preset is a no-op there.
  return Platform.OS !== 'web' && getPreferences().hapticFeedback;
}

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export function impact(style: HapticIntensity = 'medium') {
  if (!hapticsEnabled()) {
    return;
  }

  switch (style) {
    case 'light':
      return Presets.System.impactLight();
    case 'heavy':
      return Presets.System.impactHeavy();
    case 'medium':
    default:
      return Presets.System.impactMedium();
  }
}

export function selection() {
  if (!hapticsEnabled()) {
    return;
  }
  Presets.System.selection();
}

export type NotificationHapticType = 'success' | 'warning' | 'error';

export function notification(type: NotificationHapticType) {
  if (!hapticsEnabled()) {
    return;
  }

  switch (type) {
    case 'success':
      return Presets.System.notificationSuccess();
    case 'warning':
      return Presets.System.notificationWarning();
    case 'error':
    default:
      return Presets.System.notificationError();
  }
}
