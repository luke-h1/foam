import { Platform, StyleSheet } from 'react-native';

import { BlurView } from 'expo-blur';

export function EmoteSheetIosBlur({ intensity }: { intensity: number }) {
  return Platform.OS === 'ios' ? (
    <BlurView
      intensity={intensity}
      style={StyleSheet.absoluteFill}
      tint='dark'
    />
  ) : null;
}
