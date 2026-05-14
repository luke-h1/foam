import { theme } from '@app/styles/themes';
import { Button, Host } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  frame,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

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
  const width = variant === 'destructive' ? 104 : 112;

  return (
    <Host style={[styles.host, { width }, style]}>
      <Button
        label={label}
        onPress={onPress}
        role={variant === 'destructive' ? 'destructive' : 'default'}
        systemImage={
          variant === 'destructive'
            ? 'person.crop.circle.badge.xmark'
            : 'arrow.clockwise'
        }
        modifiers={[
          buttonStyle(
            variant === 'destructive' ? 'bordered' : 'borderedProminent',
          ),
          controlSize('small'),
          tint(
            variant === 'destructive' ? theme.colorRed : theme.colorDarkGreen,
          ),
          frame({ width, height: 36 }),
        ]}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flexShrink: 0,
    height: 36,
  },
});
