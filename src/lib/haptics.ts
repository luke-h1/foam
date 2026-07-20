import { Platform } from 'react-native';

import {
  AndroidHaptics,
  impactAsync as expoImpactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
  selectionAsync as expoSelectionAsync,
} from 'expo-haptics';

import { getPreferences } from '@app/store/preferences/state';

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

/**
 * performAndroidHapticsAsync uses performHapticFeedback constants (respects
 * system settings); impactAsync/selectionAsync fall back to the legacy Vibrator.
 */
function getAndroidHaptic(style: 'light' | 'medium' | 'heavy') {
  switch (style) {
    case 'light':
      return AndroidHaptics.Virtual_Key;
    case 'heavy':
      return AndroidHaptics.Long_Press;
    case 'medium':
    default:
      return AndroidHaptics.Context_Click;
  }
}

export async function impact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!hapticsEnabled()) {
    return undefined;
  }
  if (Platform.OS === 'android') {
    return performAndroidHapticsAsync(getAndroidHaptic(style));
  }
  return expoImpactAsync(getExpoImpactStyle(style));
}

export async function selection() {
  if (!hapticsEnabled()) {
    return undefined;
  }
  if (Platform.OS === 'android') {
    return performAndroidHapticsAsync(AndroidHaptics.Segment_Tick);
  }
  return expoSelectionAsync();
}
