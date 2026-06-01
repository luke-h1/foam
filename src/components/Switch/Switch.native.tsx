import { Host, Switch as ExpoSwitch } from '@expo/ui';
import { useObservable, useSelector } from '@legendapp/state/react';
import { memo, useCallback, useEffect } from 'react';
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
  const displayValue$ = useObservable(Boolean(value));
  const displayValue = useSelector(displayValue$);

  useEffect(() => {
    displayValue$.set(Boolean(value));
  }, [displayValue$, value]);

  const handleValueChange = useCallback(
    (nextValue: boolean) => {
      displayValue$.set(nextValue);
      void onValueChange?.(nextValue);
    },
    [displayValue$, onValueChange],
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='switch'
      accessibilityState={{
        ...accessibilityState,
        checked: displayValue,
        disabled: disabled ?? accessibilityState?.disabled,
      }}
      style={style}
      testID={testID}
    >
      <Host colorScheme='dark' style={styles.host}>
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
