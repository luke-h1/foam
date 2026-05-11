import { Switch as NativeSwitch, StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

interface Props {
  disabled?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}

export function Switch({ disabled, onValueChange, value }: Props) {
  return (
    <NativeSwitch
      disabled={disabled}
      ios_backgroundColor={theme.color.backgroundTertiary.dark}
      onValueChange={onValueChange}
      style={styles.switch}
      thumbColor={theme.colorWhite}
      trackColor={{
        false: theme.color.backgroundTertiary.dark,
        true: theme.colorDarkGreen,
      }}
      value={Boolean(value)}
    />
  );
}

const styles = StyleSheet.create({
  switch: {
    transform: [{ scale: 0.92 }],
  },
});
