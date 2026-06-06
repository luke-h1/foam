import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync as expoImpactAsync,
  notificationAsync as expoNotificationAsync,
  selectionAsync as expoSelectionAsync,
} from 'expo-haptics';

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
  return expoImpactAsync(getExpoImpactStyle(style));
}

export async function selection() {
  return expoSelectionAsync();
}

export async function notification(
  type: 'success' | 'warning' | 'error' = 'success',
) {
  const expoType =
    type === 'warning'
      ? NotificationFeedbackType.Warning
      : type === 'error'
        ? NotificationFeedbackType.Error
        : NotificationFeedbackType.Success;

  return expoNotificationAsync(expoType);
}
