/* eslint-disable no-nested-ternary */
import { FontSize } from '@app/styles';
import { type SFSymbol, SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import {
  Pressable,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Icon, IconName, IconWeight } from '../Icon';
import { Text } from '../Text';

type Icon =
  | {
      color?: string;
      name: SFSymbol;
      size?: number;
      type: 'symbol';
    }
  | {
      color?: string;
      name: IconName;
      size?: number;
      type: 'icon';
      weight?: IconWeight;
    };

type Props = {
  icon?: Icon;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  left?: ReactNode;
  navigate?: boolean;
  onPress?: () => void;
  right?: ReactNode;
  selected?: boolean;
  size?: FontSize;
  style?: StyleProp<ViewStyle>;
};

export function SheetItem({
  icon,
  label,
  labelStyle,
  left,
  navigate,
  onPress,
  right,
  selected,
  size,
  style,
}: Props) {
  const { theme } = useUnistyles();

  return (
    <Button
      disabled={!onPress}
      label={label}
      onPress={onPress}
      style={[selected ? styles.selected : undefined, style, styles.pressable]}
    >
      {icon ? (
        icon.type === 'symbol' ? (
          <SymbolView
            name={icon.name}
            size={icon.size ?? theme.spacing.md}
            tintColor={icon.color ?? theme.colors.borderFaint}
          />
        ) : (
          <Icon
            color={icon.color ?? theme.colors.borderFaint}
            name={icon.name}
            size={icon.size ?? theme.spacing.md}
            weight={icon.weight ?? 'duotone'}
          />
        )
      ) : (
        left
      )}

      <Text
        numberOfLines={1}
        size={size}
        style={[styles.label, labelStyle]}
        weight="semiBold"
      >
        {label}
      </Text>

      {navigate ? (
        <Icon
          name="CaretRight"
          // size={theme.typography[size === '2' ? '1' : '2'].lineHeight}
        />
      ) : (
        right
      )}
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  pressable: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    height: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  label: {
    flex: 1,
  },
  selected: {
    backgroundColor: '',
  },
}));
