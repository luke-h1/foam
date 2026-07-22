import {
  type StyleProp,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
} from 'react-native';

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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const isDestructive = variant === 'destructive';

  return (
    <PressableArea
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.button,
        {
          backgroundColor: isDestructive
            ? theme.color.dangerSurface[scheme]
            : theme.color.accent[scheme],
        },
        style,
      ]}
    >
      <Text
        type='xs'
        weight='bold'
        style={{
          color: isDestructive ? theme.color.danger[scheme] : theme.colorBlack,
        }}
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
});
