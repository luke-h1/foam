import {
  type Insets,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { resolveSpacingValue, type Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

import { Button } from '../button/button';
import { IconButtonIcon, type IconType } from './icon-button-icon';

interface IconButtonProps {
  hitSlop?: number | Insets | undefined;
  icon: IconType;
  label: string;
  loading?: boolean | undefined;
  onLongPress?: (() => void) | undefined;
  onPress?: (() => void) | undefined;
  size?: Spacing | undefined;
  style?: StyleProp<ViewStyle> | undefined;
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
      {...(hitSlop !== undefined ? { hitSlop } : {})}
      label={label}
      style={[styles.button, getButtonSizeStyle(size), style]}
      {...(onLongPress ? { onLongPress } : {})}
      {...(onPress ? { onPress } : {})}
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
