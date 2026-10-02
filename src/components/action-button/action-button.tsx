import {
  ActivityIndicator,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { Button, type ButtonProps } from '@app/components/button/button';
import { type SFSymbol, SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

type ActionButtonVariant = 'primary' | 'secondary' | 'plain' | 'brand';

type ActionButtonSize = 'regular' | 'small';

export interface ActionButtonProps extends Pick<
  ButtonProps,
  'onPress' | 'haptic'
> {
  title: string;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  icon?: SFSymbol;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantColors = {
  primary: { background: theme.color.accent.dark, label: theme.colorWhite },
  secondary: {
    background: theme.color.surfaceElevated.dark,
    label: theme.color.text.dark,
  },
  plain: { background: 'transparent', label: theme.color.accent.dark },
  brand: { background: theme.color.brand.twitch, label: theme.colorWhite },
} satisfies Record<ActionButtonVariant, { background: string; label: string }>;

/**
 * Pill-shaped action button. Use `primary` for the main action on a screen,
 * `secondary` for the others and `plain` for links. Use `brand` (Twitch
 * purple) only for Twitch sign-in.
 */
export function ActionButton({
  title,
  variant = 'primary',
  size = 'regular',
  icon,
  loading = false,
  disabled = false,
  onPress,
  haptic,
  style,
}: ActionButtonProps) {
  const colors = variantColors[variant];
  const isInactive = disabled || loading;

  return (
    <Button
      label={title}
      haptic={haptic}
      disabled={isInactive}
      onPress={onPress}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        styles.base,
        size === 'small' ? styles.small : styles.regular,
        { backgroundColor: colors.background },
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={[styles.content, loading ? styles.hidden : null]}>
        {icon ? (
          <SymbolView
            name={icon}
            size={size === 'small' ? 15 : 17}
            tintColor={colors.label}
            weight='semibold'
          />
        ) : null}

        <Text
          type={size === 'small' ? 'subhead' : 'headline'}
          weight='semibold'
          numberOfLines={1}
          style={{ color: colors.label }}
        >
          {title}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.label}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </Button>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    justifyContent: 'center',
  },
  regular: {
    minHeight: 50,
    paddingHorizontal: theme.space24,
  },
  small: {
    minHeight: 36,
    paddingHorizontal: theme.space16,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  hidden: {
    opacity: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});
