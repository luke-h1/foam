import { Presets } from 'react-native-pulsar';

import { getPreferences } from '@app/store/preferences/state';

function hapticsEnabled(): boolean {
  return getPreferences().hapticFeedback;
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
