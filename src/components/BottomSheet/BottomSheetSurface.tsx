import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';

export function BottomSheetSurface() {
  return <View style={[StyleSheet.absoluteFill, styles.surface]} />;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: '#0b0b0d',
    borderCurve: 'continuous',
    borderTopLeftRadius: theme.borderRadius28,
    borderTopRightRadius: theme.borderRadius28,
    overflow: 'hidden',
  },
});
