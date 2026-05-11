import { resolveSpacingValue, Spacing } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';
import { type SFSymbol, SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Insets,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';

type IconType =
  | {
      color?: string;
      name: SFSymbol;
      size?: number;
      type: 'symbol';
    }
  | {
      color?: string;
      name: string;
      size?: number;
      type: 'icon';
    }
  | string; // For backward compatibility

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
  const renderIcon = () => {
    if (loading) {
      return <ActivityIndicator color={theme.color.text.dark} />;
    }

    if (typeof icon === 'string') {
      return <Icon icon={icon} />;
    }

    if (icon.type === 'symbol') {
      return (
        <SymbolView
          name={icon.name}
          size={icon.size ?? resolveSpacingValue(theme, size)}
          tintColor={icon.color ?? theme.colorGrey}
        />
      );
    }

    return <Icon icon={icon.name} color={icon.color} size={icon.size} />;
  };

  return (
    <Button
      disabled={loading}
      hitSlop={hitSlop}
      label={label}
      style={[styles.button, getButtonSizeStyle(size), style]}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      {renderIcon()}
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
