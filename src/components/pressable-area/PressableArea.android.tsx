import { StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import type { PressableAreaProps } from './PressableArea.types';

export function PressableArea({
  ref,
  children,
  android_ripple,
  feedback: _feedback,
  ...rest
}: PressableAreaProps) {
  return (
    <Pressable
      accessibilityRole='button'
      android_ripple={android_ripple ?? { color: 'rgba(255, 255, 255, 0.12)' }}
      {...rest}
      {...(ref !== undefined ? { ref } : {})}
    >
      <View style={styles.pressable}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
});
