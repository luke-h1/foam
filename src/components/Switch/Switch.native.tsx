import { memo,useEffect } from 'react';
import {
  StyleSheet,
  type SwitchProps as NativeSwitchProps,
  View,
} from 'react-native';

import { Host, Switch as ExpoSwitch } from '@expo/ui';
import { useObservable, useSelector } from '@legendapp/state/react';

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

  const handleValueChange = (nextValue: boolean) => {
    displayValue$.set(nextValue);
    void onValueChange?.(nextValue);
  };

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
