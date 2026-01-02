/* eslint-disable no-nested-ternary */
import { type SFSymbol, SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BrandIcon, type BrandIconName } from '../BrandIcon';
import { Button } from '../Button';
import { Icon } from '../Icon';
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
      name: string;
      size?: number;
      type: 'icon';
    }
  | {
      color?: string;
      name: BrandIconName;
      size?: number;
      type: 'brandIcon';
    };

export type SheetItemProps = {
  icon?: Icon;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  left?: ReactNode;
  navigate?: boolean;
  onPress?: () => void;
  right?: ReactNode;
  selected?: boolean;
  size?: unknown;
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
  style,
}: SheetItemProps) {
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
            tintColor={icon.color ?? theme.colors.black.bgAltAlpha}
          />
        ) : icon.type === 'brandIcon' ? (
          <BrandIcon
            name={icon.name}
            color={icon.color ?? theme.colors.black.bgAltAlpha}
            size="md"
          />
        ) : (
          <Icon icon={icon.name} color={icon.color} />
        )
      ) : (
        left
      )}

      <Text
        numberOfLines={1}
        style={[styles.label, labelStyle]}
        weight="semibold"
      >
        {label}
      </Text>

      {navigate ? <Icon icon="CaretRight" /> : right}
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  pressable: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  label: {
    flex: 1,
  },
  selected: {
    backgroundColor: '',
  },
}));
