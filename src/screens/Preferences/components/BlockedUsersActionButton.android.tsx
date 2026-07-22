import {
  type StyleProp,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
} from 'react-native';

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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const isDestructive = variant === 'destructive';
  const Component = isDestructive ? TextButton : Button;
  const width = isDestructive ? 104 : 112;

  return (
    <Host style={[styles.host, { width }, style]}>
      <Component
        onClick={onPress}
        colors={{
          containerColor: isDestructive
            ? theme.color.dangerSurface[scheme]
            : theme.color.accent[scheme],
          contentColor: isDestructive
            ? theme.color.danger[scheme]
            : theme.colorBlack,
        }}
        contentPadding={{ start: 12, top: 6, end: 12, bottom: 6 }}
        modifiers={[size(width, 36)]}
        shape={Shape.Pill({})}
      >
        <ComposeText
          color={isDestructive ? theme.color.danger[scheme] : theme.colorBlack}
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
