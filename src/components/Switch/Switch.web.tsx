import { theme } from '@app/styles/themes';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Switch as NativeSwitch,
  type SwitchProps as NativeSwitchProps,
} from 'react-native';

export const Switch = memo(function Switch({
  accessibilityState,
  disabled,
  onValueChange,
  style,
  trackColor,
  value,
  ...props
}: NativeSwitchProps) {
  const [displayValue, setDisplayValue] = useState(Boolean(value));

  useEffect(() => {
    setDisplayValue(Boolean(value));
  }, [value]);

  const handleValueChange = useCallback(
    (nextValue: boolean) => {
      setDisplayValue(nextValue);
      void onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  return (
    <NativeSwitch
      {...props}
      accessibilityRole="switch"
      accessibilityState={{
        ...accessibilityState,
        checked: displayValue,
        disabled: disabled ?? accessibilityState?.disabled,
      }}
      disabled={disabled}
      ios_backgroundColor={theme.color.backgroundTertiary.dark}
      onValueChange={handleValueChange}
      style={[styles.switch, style]}
      thumbColor={theme.colorWhite}
      trackColor={
        trackColor ?? {
          false: theme.color.backgroundTertiary.dark,
          true: theme.colorDarkGreen,
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
