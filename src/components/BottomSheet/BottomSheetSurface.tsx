import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { theme } from '@app/styles/themes';

export function BottomSheetSurface() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (Platform.OS === 'ios') {
    if (isLiquidGlassAvailable()) {
      return (
        <GlassView
          glassEffectStyle='regular'
          colorScheme={scheme}
          tintColor={
            scheme === 'light'
              ? 'rgba(255,255,255,0.28)'
              : 'rgba(11,15,20,0.28)'
          }
          style={[StyleSheet.absoluteFill, styles.surface]}
        />
      );
    }

    return (
      <BlurView
        intensity={64}
        tint={scheme}
        style={[StyleSheet.absoluteFill, styles.surface]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                scheme === 'light'
                  ? 'rgba(255,255,255,0.55)'
                  : 'rgba(10,10,12,0.55)',
            },
          ]}
        />
      </BlurView>
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.surface,
        { backgroundColor: theme.color.surfaceElevated[scheme] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    overflow: 'hidden',
  },
});
