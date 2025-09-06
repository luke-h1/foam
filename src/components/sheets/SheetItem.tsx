/* eslint-disable no-nested-ternary */
import { type SFSymbol, SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Typography } from '../Typography';

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
        ) : (
          <Icon icon={icon.name} />
        )
      ) : (
        left
      )}

      <Typography
        numberOfLines={1}
        style={[styles.label, labelStyle]}
        fontWeight="semiBold"
      >
        {label}
      </Typography>

      {navigate ? <Icon icon="CaretRight" /> : right}
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
