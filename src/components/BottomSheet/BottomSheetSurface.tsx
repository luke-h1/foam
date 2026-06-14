import { theme } from '@app/styles/themes';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

export function BottomSheetSurface() {
  if (Platform.OS === 'ios') {
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
    backgroundColor: '#0b0b0d',
  },
  surface: {
    borderCurve: 'continuous',
    borderTopLeftRadius: theme.borderRadius28,
    borderTopRightRadius: theme.borderRadius28,
    overflow: 'hidden',
  },
  tint: {
    backgroundColor: 'rgba(10,10,12,0.55)',
  },
});
