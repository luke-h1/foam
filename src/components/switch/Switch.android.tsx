import { memo, useEffect } from 'react';
import {
  StyleSheet,
  type SwitchProps as NativeSwitchProps,
  View,
} from 'react-native';

import { Switch as ComposeSwitch } from '@expo/ui/jetpack-compose';
import { useObservable, useSelector } from '@legendapp/state/react';

import { FoamComposeHost } from '@app/components/compose-host/FoamComposeHost';
import { iosMatchedSwitchColors } from '@app/styles/compose-switch-colors';

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
      <FoamComposeHost matchContents style={styles.host}>
        <ComposeSwitch
          colors={iosMatchedSwitchColors}
          enabled={disabled !== true}
          onCheckedChange={handleValueChange}
          value={displayValue}
        />
      </FoamComposeHost>
    </View>
  );
});

const styles = StyleSheet.create({
  host: {
    height: 36,
    width: 64,
  },
});
