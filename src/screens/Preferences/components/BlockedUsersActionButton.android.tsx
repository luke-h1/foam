import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import {
  Button,
  Host,
  Shape,
  Text as ComposeText,
  TextButton,
} from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';

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
  const Component = isDestructive ? TextButton : Button;
  const width = isDestructive ? 104 : 112;

  return (
    <Host style={[styles.host, { width }, style]}>
      <Component
        onClick={onPress}
        colors={{
          containerColor: isDestructive
            ? theme.colorRedSurface
            : theme.colorPrimary,
          contentColor: isDestructive ? theme.colorRed : theme.colorBlack,
        }}
        contentPadding={{ start: 12, top: 6, end: 12, bottom: 6 }}
        modifiers={[size(width, 36)]}
        shape={Shape.Pill({})}
      >
        <ComposeText
          color={isDestructive ? theme.colorRed : theme.colorBlack}
          style={{ typography: 'labelMedium', fontWeight: '700' }}
        >
          {label}
        </ComposeText>
      </Component>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flexShrink: 0,
    height: 36,
  },
});
