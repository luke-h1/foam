import { getPreferences } from '@app/store/preferences/state';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync as expoImpactAsync,
  notificationAsync as expoNotificationAsync,
  selectionAsync as expoSelectionAsync,
} from 'expo-haptics';

function hapticsEnabled(): boolean {
  return getPreferences().hapticFeedback;
}

function getExpoImpactStyle(style: 'light' | 'medium' | 'heavy') {
  switch (style) {
    case 'light':
      return ImpactFeedbackStyle.Light;
    case 'heavy':
      return ImpactFeedbackStyle.Heavy;
    case 'medium':
    default:
      return ImpactFeedbackStyle.Medium;
  }
}

export async function impact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!hapticsEnabled()) {
    return undefined;
  }
  return expoImpactAsync(getExpoImpactStyle(style));
}

export async function selection() {
  if (!hapticsEnabled()) {
    return undefined;
  }
  return expoSelectionAsync();
}

export async function notification(
  type: 'success' | 'warning' | 'error' = 'success',
) {
  if (!hapticsEnabled()) {
    return undefined;
  }

  const expoType =
    type === 'warning'
      ? NotificationFeedbackType.Warning
      : type === 'error'
        ? NotificationFeedbackType.Error
        : NotificationFeedbackType.Success;

  return expoNotificationAsync(expoType);
}
