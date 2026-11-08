import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { theme } from '@app/styles/themes';

import { COMPOSER_CONTROL_RADIUS } from '../util/composerSizing';

export function ReplyPreviewChrome({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shell}>
      {isLiquidGlassAvailable() ? (
        <GlassView
          glassEffectStyle='clear'
          colorScheme='dark'
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView intensity={32} style={StyleSheet.absoluteFill} tint='dark' />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,12,0.74)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: COMPOSER_CONTROL_RADIUS,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    marginHorizontal: theme.space12,
    overflow: 'hidden',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
