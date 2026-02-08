import { Spacing } from '@app/styles/spacing';
import { type SFSymbol, SymbolView } from 'expo-symbols';
import { Insets, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Spinner } from '../Spinner/Spinner';

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
  const { theme } = useUnistyles();

  const renderIcon = () => {
    if (loading) {
      return <Spinner />;
    }

    if (typeof icon === 'string') {
      return <Icon icon={icon} />;
    }

    if (icon.type === 'symbol') {
      return (
        <SymbolView
          name={icon.name}
          size={icon.size ?? theme.spacing[size]}
          tintColor={icon.color ?? theme.colors.gray.accent}
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
      style={[styles.button(size), style]}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      {renderIcon()}
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  button: (size: Spacing) => ({
    alignItems: 'center',
    height: theme.spacing[size],
    width: theme.spacing[size],
  }),
}));
