import { Platform, StyleSheet } from 'react-native';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

export function EmoteSheetIosBlur() {
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
    <BlurView intensity={32} style={StyleSheet.absoluteFill} tint='dark' />
  );
}
