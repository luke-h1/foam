import { StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';

// Full-screen tap target above the WebView, below the controls overlay: the single handler
// for video-area taps (the overlay is box-none, so empty-area taps reach this gesture).
export function TouchBlockOverlay({
  gesture,
}: {
  gesture: ComponentProps<typeof GestureDetector>['gesture'];
}) {
  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.touchBlockOverlay}
        accessibilityLabel='Show player controls'
        accessibilityRole='button'
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touchBlockOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
