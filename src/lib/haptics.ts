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

export type HapticIntensity = 'light' | 'medium' | 'heavy';

function getExpoImpactStyle(style: HapticIntensity) {
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

function getAndroidHaptic(style: HapticIntensity) {
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

export async function impact(style: HapticIntensity = 'medium') {
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
