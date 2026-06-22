import { Insets, StyleProp, StyleSheet,ViewStyle } from 'react-native';

import { type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { resolveSpacingValue, Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

import { Button } from '../Button/Button';
import { IconButtonIcon } from './IconButtonIcon';

type IconType =
  | {
      color?: string;
      name: SymbolViewProps['name'];
      size?: number;
      type: 'symbol';
    }
  | SymbolViewProps['name'];

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
  },
});

function getButtonSizeStyle(size: Spacing) {
  const dimension = resolveSpacingValue(theme, size);

  return {
    height: dimension,
    width: dimension,
  };
}
