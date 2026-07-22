import { memo, useEffect } from 'react';
import {
  StyleSheet,
  Switch as NativeSwitch,
  type SwitchProps as NativeSwitchProps,
  useColorScheme,
} from 'react-native';

import { useObservable, useSelector } from '@legendapp/state/react';

import { theme } from '@app/styles/themes';

export const Switch = memo(function Switch({
  accessibilityState,
  disabled,
  onValueChange,
  style,
  trackColor,
  value,
  ...props
}: NativeSwitchProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const displayValue$ = useObservable(Boolean(value));
  const displayValue = useSelector(displayValue$);

  useEffect(() => {
    displayValue$.set(Boolean(value));
  }, [displayValue$, value]);

  const handleValueChange = (nextValue: boolean) => {
    displayValue$.set(nextValue);
    void onValueChange?.(nextValue);
  };

  return (
    <NativeSwitch
      {...props}
      accessibilityRole='switch'
      accessibilityState={{
        ...accessibilityState,
        checked: displayValue,
        disabled: disabled ?? accessibilityState?.disabled,
      }}
      disabled={disabled}
      ios_backgroundColor={theme.color.backgroundTertiary[scheme]}
      onValueChange={handleValueChange}
      style={[styles.switch, style]}
      thumbColor={theme.colorWhite}
      trackColor={
        trackColor ?? {
          false: theme.color.backgroundTertiary[scheme],
          true: theme.color.accent[scheme],
        }
      }
      value={displayValue}
    />
  );
});

const styles = StyleSheet.create({
  switch: {
    transform: [{ scale: 0.92 }],
  },
});
