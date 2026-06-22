import { PropsWithChildren, type Ref, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EaseView } from 'react-native-ease';
import type { PressableProps } from 'react-native-gesture-handler';
import { Pressable } from 'react-native-gesture-handler';

import { motion } from '@app/styles/motion';

const isAndroid = process.env.EXPO_OS === 'android';

export function PressableArea({
  ref,
  children,
  onPressIn,
  onPressOut,
  style,
  android_ripple,
  ...rest
}: PropsWithChildren<PressableProps> & { ref?: Ref<View> }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole='button'
      android_ripple={
        android_ripple ??
        (isAndroid ? { color: 'rgba(255, 255, 255, 0.12)' } : undefined)
      }
      {...rest}
      ref={ref}
      style={style}
      onPressIn={e => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        setPressed(false);
        onPressOut?.(e);
      }}
    >
      <EaseView
        animate={{ opacity: pressed && !isAndroid ? 0.75 : 1 }}
        transition={{ type: 'timing', duration: motion.fast }}
        style={styles.pressable}
      >
        {children}
      </EaseView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
});
