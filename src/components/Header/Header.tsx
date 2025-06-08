import { ReactElement } from 'react';
import { StyleProp, TextStyle, View, ViewProps, ViewStyle } from 'react-native';
import { Edge } from 'react-native-safe-area-context';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button, ButtonProps } from '../Button';
import { Icon } from '../Icon';
import { SafeAreaViewFixed } from '../SafeAreaViewFixed';
import { Typography, TypographyProps } from '../Typography';

export interface HeaderProps {
  /**
   * The layout of the title relative to the action components.
   * - `center` will force the title to always be centered relative to the header. If the title or the action buttons are too long, the title will be cut off.
   * - `flex` will attempt to center the title relative to the action buttons. If the action buttons are different widths, the title will be off-center relative to the header.
   */
  titleMode?: 'center' | 'flex';

  /**
   * Optional title style override.
   */
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Optional header style override.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Title text to display if not using `tx` or nested components.
   */
  title?: TypographyProps['children'];

  /**
   * Icon that should appear on the left.
   * Can be used with `onLeftPress`.
   */
  leftIcon?: string;
  /**
   * An optional tint color for the left icon
   */
  leftIconColor?: string;
  /**
   * Left action text to display if not using `leftTx`.
   * Can be used with `onLeftPress`. Overrides `leftIcon`.
   */
  leftText?: TypographyProps['children'];

  /**
   * Left action custom ReactElement if the built in action props don't suffice.
   * Overrides `leftIcon`, `leftTx` and `leftText`.
   */
  LeftActionComponent?: ReactElement;

  /**
   * What happens when you press the left icon or text action.
   */
  onLeftPress?: ButtonProps['onPress'];
  /**
   * Icon that should appear on the right.
   * Can be used with `onRightPress`.
   */
  rightIcon?: string;
  /**
   * An optional tint color for the right icon
   */
  rightIconColor?: string;
  /**
   * Right action text to display if not using `rightTx`.
   * Can be used with `onRightPress`. Overrides `rightIcon`.
   */
  rightText?: TypographyProps['children'];
  /**
   * Right action custom ReactElement if the built in action props don't suffice.
   * Overrides `rightIcon`, `rightTx` and `rightText`.
   */
  RightActionComponent?: ReactElement;
  /**
   * What happens when you press the right icon or text action.
   */
  onRightPress?: ButtonProps['onPress'];
  /**
   * Override the default edges for the safe area.
   */
  safeAreaEdges?: Edge[];
  /**
   * Pass any additional props directly to the Header View component.
   */
  HeaderViewProps?: ViewProps;
}

interface HeaderActionProps {
  backgroundColor?: string;
  icon?: string;
  iconColor?: string;
  text?: TypographyProps['children'];
  onPress?: ButtonProps['onPress'];
  ActionComponent?: ReactElement;
}

/**
 * Header that appears on many screens. Will hold navigation buttons and screen title.
 * The Header is meant to be used with the `screenOptions.header` option on navigators,routes, or screen components via `navigation.setOptions({ header })`.
 */
export function Header({
  backgroundColor,
  LeftActionComponent,
  leftIcon,
  leftIconColor,
  leftText,
  onLeftPress,
  onRightPress,
  RightActionComponent,
  rightIcon,
  rightIconColor,
  rightText,
  safeAreaEdges = ['top'],
  HeaderViewProps,
  title,
  titleMode = 'center',
  titleStyle: $titleStyleOverride,
  containerStyle: $containerStyleOverride,
}: HeaderProps) {
  const titleContent = title;

  const { styles, theme } = useStyles(styleSheet);

  return (
    <SafeAreaViewFixed
      edges={safeAreaEdges}
      {...HeaderViewProps}
      style={[
        styles.safeArea,
        HeaderViewProps?.style,
        { backgroundColor: backgroundColor ?? theme.colors.screen },
      ]}
    >
      <View style={[styles.container, $containerStyleOverride]}>
        <HeaderAction
          text={leftText}
          icon={leftIcon}
          iconColor={leftIconColor}
          onPress={onLeftPress}
          backgroundColor={backgroundColor}
          ActionComponent={LeftActionComponent}
        />

        {!!titleContent && (
          <Typography
            maxFontSizeMultiplier={3}
            style={[
              titleMode === 'center' && styles.centerTitle,
              titleMode === 'flex' && styles.flexTitle,
              $titleStyleOverride,
            ]}
          >
            {titleContent}
          </Typography>
        )}

        <HeaderAction
          text={rightText}
          icon={rightIcon}
          iconColor={rightIconColor}
          onPress={onRightPress}
          backgroundColor={backgroundColor}
          ActionComponent={RightActionComponent}
        />
      </View>
    </SafeAreaViewFixed>
  );
}

export function HeaderAction({
  backgroundColor,
  icon,
  text,
  onPress,
  ActionComponent,
  iconColor,
}: HeaderActionProps) {
  const content = text;

  const { styles } = useStyles(styleSheet);

  if (ActionComponent) {
    return ActionComponent;
  }

  if (content) {
    return (
      <Button
        style={[styles.actionTextContainer, { backgroundColor }]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        <Typography maxFontSizeMultiplier={1.5} size="md">
          {content}
        </Typography>
      </Button>
    );
  }

  if (icon) {
    return (
      <Icon
        size={24}
        icon={icon}
        color={iconColor}
        accessibilityHint={icon}
        onPress={onPress}
        containerStyle={[styles.actionIconContainer, { backgroundColor }]}
      />
    );
  }
  return <View style={[styles.actionFillContainer, { backgroundColor }]} />;
}

const styleSheet = createStyleSheet(theme => ({
  safeArea: {
    width: '100%',
  },
  container: {
    height: theme.spacing.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerTitle: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    zIndex: 1,
  },
  flexTitle: {
    flex: 1,
    textAlign: 'center',
  },
  actionTextContainer: {
    flexGrow: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: theme.spacing.md,
    zIndex: 2,
  },
  actionIconContainer: {
    flexGrow: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: theme.spacing.md,
    zIndex: 2,
  },
  actionFillContainer: {
    width: 16,
  },
}));
