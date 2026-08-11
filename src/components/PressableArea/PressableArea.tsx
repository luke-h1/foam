import {
  createContext,
  PropsWithChildren,
  type Ref,
  use,
  useCallback,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { EaseView } from 'react-native-ease';
import type { PressableProps } from 'react-native-gesture-handler';
import { Pressable } from 'react-native-gesture-handler';

import { motion } from '@app/styles/motion';

const isAndroid = process.env.EXPO_OS === 'android';

/**
 * Nested pressables both begin on the same touch-down, so without this an
 * inner target dims itself while the row it sits in dims too. A descendant
 * claims the touch and every ancestor stands down.
 */
const NestedPressContext = createContext<
  ((pressed: boolean) => void) | undefined
>(undefined);

/**
 * `feedback='highlight'` fills the row background while pressed instead of
 * dimming the content; use it for full-bleed list rows.
 */
export function PressableArea({
  ref,
  children,
  onPressIn,
  onPressOut,
  style,
  android_ripple,
  feedback = 'dim',
  ...rest
}: PropsWithChildren<PressableProps> & {
  ref?: Ref<View>;
  feedback?: 'dim' | 'highlight';
}) {
  const notifyAncestor = use(NestedPressContext);
  const [pressed, setPressed] = useState(false);
  const [descendantPressed, setDescendantPressed] = useState(false);

  const handleDescendantPress = useCallback(
    (isPressed: boolean) => {
      setDescendantPressed(isPressed);
      notifyAncestor?.(isPressed);
    },
    [notifyAncestor],
  );

  const iosPressed = pressed && !descendantPressed && !isAndroid;

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
        notifyAncestor?.(true);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        setPressed(false);
        notifyAncestor?.(false);
        onPressOut?.(e);
      }}
    >
      <EaseView
        animate={
          feedback === 'highlight'
            ? {
                backgroundColor: iosPressed
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0)',
              }
            : { opacity: iosPressed ? 0.75 : 1 }
        }
        transition={{ type: 'timing', duration: motion.instant }}
        style={styles.pressable}
      >
        <NestedPressContext.Provider value={handleDescendantPress}>
          {children}
        </NestedPressContext.Provider>
      </EaseView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
});
