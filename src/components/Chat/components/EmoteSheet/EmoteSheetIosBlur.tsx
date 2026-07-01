import { Platform, StyleSheet } from 'react-native';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

export function EmoteSheetIosBlur({ intensity }: { intensity: number }) {
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle='clear'
        colorScheme='dark'
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <BlurView
      intensity={intensity}
      style={StyleSheet.absoluteFill}
      tint='dark'
    />
  );
}
