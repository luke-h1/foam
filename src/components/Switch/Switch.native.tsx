import { Host, Switch as ExpoSwitch } from '@expo/ui';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  type SwitchProps as NativeSwitchProps,
} from 'react-native';

export const Switch = memo(function Switch({
  accessibilityLabel,
  accessibilityState,
  disabled,
  onValueChange,
  style,
  testID,
  value,
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
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{
        ...accessibilityState,
        checked: displayValue,
        disabled: disabled ?? accessibilityState?.disabled,
      }}
      style={style}
      testID={testID}
    >
      <Host colorScheme="dark" style={styles.host}>
        <ExpoSwitch
          disabled={disabled}
          onValueChange={handleValueChange}
          testID={testID}
          value={displayValue}
        />
      </Host>
    </View>
  );
});

const styles = StyleSheet.create({
  host: {
    height: 36,
    width: 64,
  },
});
