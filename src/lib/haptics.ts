import { getPreferences } from '@app/store/preferences/state';
import {
  ImpactFeedbackStyle,
  impactAsync as expoImpactAsync,
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
