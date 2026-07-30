import { Platform, StyleSheet, View } from 'react-native';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { theme } from '@app/styles/themes';

export function BottomSheetSurface() {
  if (Platform.OS === 'ios') {
    if (isLiquidGlassAvailable()) {
      return (
        <GlassView
          glassEffectStyle='regular'
          colorScheme='dark'
          tintColor='rgba(11,15,20,0.28)'
          style={[StyleSheet.absoluteFill, styles.surface]}
        />
      );
    }

    return (
      <BlurView
        intensity={64}
        tint='dark'
        style={[StyleSheet.absoluteFill, styles.surface]}
      >
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
      </BlurView>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.surface, styles.solid]} />
  );
}

const styles = StyleSheet.create({
  solid: {
    backgroundColor: theme.color.surfaceElevated.dark,
  },
  surface: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    overflow: 'hidden',
  },
  tint: {
    backgroundColor: 'rgba(10,10,12,0.55)',
  },
});
