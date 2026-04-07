import { PropsWithChildren, Ref, forwardRef, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable, PressableProps, View, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

export const PressableArea = forwardRef(
  (props: PropsWithChildren<PressableProps>, ref: Ref<View>) => {
    const [pressed, setPressed] = useState(false);

    const { onPressIn, onPressOut, style, children, ...rest } = props;

    return (
      <Pressable
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
          animate={{ opacity: pressed ? 0.75 : 1 }}
          transition={{ type: 'timing', duration: 150 }}
          style={styles.pressable}
        >
          {children}
        </EaseView>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
});

PressableArea.displayName = 'PressableArea';
