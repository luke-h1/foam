import { Insets, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { resolveSpacingValue, Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

import { Button } from '../button/button';
import { IconButtonIcon, type IconType } from './icon-button-icon';

interface IconButtonProps {
  hitSlop?: number | Insets;
  icon: IconType;
  label: string;
  loading?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  size?: Spacing;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  hitSlop,
  icon,
  label,
  loading,
  onLongPress,
  onPress,
  size = 'md',
  style,
}: IconButtonProps) {
  return (
    <Button
      disabled={loading}
      hitSlop={hitSlop}
      label={label}
      style={[styles.button, getButtonSizeStyle(size), style]}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      <IconButtonIcon icon={icon} loading={loading} size={size} />
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function getButtonSizeStyle(size: Spacing) {
  const dimension = resolveSpacingValue(theme, size);

  return {
    height: dimension,
    width: dimension,
  };
}
