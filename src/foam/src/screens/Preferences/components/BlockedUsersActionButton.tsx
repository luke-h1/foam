import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export interface BlockedUsersActionButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'destructive' | 'primary';
}

export function BlockedUsersActionButton({
  label,
  onPress,
  style,
  variant = 'primary',
}: BlockedUsersActionButtonProps) {
  const isDestructive = variant === 'destructive';

  return (
    <PressableArea
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.button,
        isDestructive ? styles.destructiveButton : styles.primaryButton,
        style,
      ]}
    >
      <Text
        type='xs'
        weight='bold'
        style={isDestructive ? styles.destructiveLabel : styles.primaryLabel}
      >
        {label}
      </Text>
    </PressableArea>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    justifyContent: 'center',
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  destructiveButton: {
    backgroundColor: theme.colorRedSurface,
  },
  destructiveLabel: {
    color: theme.colorRed,
  },
  primaryButton: {
    backgroundColor: theme.colorPrimary,
  },
  primaryLabel: {
    color: theme.colorBlack,
  },
});
