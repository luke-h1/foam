import {
  type Insets,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { resolveSpacingValue, type Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

import { Button } from '../button/Button';
import { IconButtonIcon, type IconType } from './IconButtonIcon';

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
      {...(hitSlop !== undefined ? { hitSlop } : {})}
      style={[styles.button, getButtonSizeStyle(size), style]}
      {...(onLongPress ? { onLongPress } : {})}
      {...(onPress ? { onPress } : {})}
      {...{ disabled: loading, label }}
    >
      <IconButtonIcon {...{ icon, loading, size }} />
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
