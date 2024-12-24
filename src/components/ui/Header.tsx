import { colors, layout, spacing } from '@app/styles';
import { ReactElement } from 'react';
import {
  StyleProp,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { Edge } from 'react-native-safe-area-context';
import Icon from './Icon';
import SafeAreaViewFixed from './SafeAreaViewFixed';
import { Text, TextProps } from './Text';

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
  title?: TextProps['text'];

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
  leftText?: TextProps['text'];

  /**
   * Left action custom ReactElement if the built in action props don't suffice.
   * Overrides `leftIcon`, `leftTx` and `leftText`.
   */
  LeftActionComponent?: ReactElement;

  /**
   * What happens when you press the left icon or text action.
   */
  onLeftPress?: TouchableOpacityProps['onPress'];
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
  rightText?: TextProps['text'];
  /**
   * Right action custom ReactElement if the built in action props don't suffice.
   * Overrides `rightIcon`, `rightTx` and `rightText`.
   */
  RightActionComponent?: ReactElement;
  /**
   * What happens when you press the right icon or text action.
   */
  onRightPress?: TouchableOpacityProps['onPress'];
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
  text?: TextProps['text'];
  onPress?: TouchableOpacityProps['onPress'];
  ActionComponent?: ReactElement;
}

/**
 * Header that appears on many screens. Will hold navigation buttons and screen title.
 * The Header is meant to be used with the `screenOptions.header` option on navigators,routes, or screen components via `navigation.setOptions({ header })`.
 */
export function Header({
  backgroundColor = colors.background,
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

  return (
    <SafeAreaViewFixed
      edges={safeAreaEdges}
      {...HeaderViewProps}
      style={[$safeArea, HeaderViewProps?.style, { backgroundColor }]}
    >
      <View style={[$container, $containerStyleOverride]}>
        <HeaderAction
          text={leftText}
          icon={leftIcon}
          iconColor={leftIconColor}
          onPress={onLeftPress}
          backgroundColor={backgroundColor}
          ActionComponent={LeftActionComponent}
        />

        {!!titleContent && (
          <Text
            maxFontSizeMultiplier={3}
            preset="navHeader"
            text={titleContent}
            style={[
              titleMode === 'center' && $centerTitle,
              titleMode === 'flex' && $flexTitle,
              $titleStyleOverride,
            ]}
          />
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

  if (ActionComponent) {
    return ActionComponent;
  }

  if (content) {
    return (
      <TouchableOpacity
        style={[$actionTextContainer, { backgroundColor }]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        <Text
          maxFontSizeMultiplier={1.5}
          weight="medium"
          size="md"
          text={content}
          style={$actionText}
        />
      </TouchableOpacity>
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
        containerStyle={[$actionIconContainer, { backgroundColor }]}
      />
    );
  }
  return <View style={[$actionFillerContainer, { backgroundColor }]} />;
}

const $safeArea: ViewStyle = {
  width: '100%',
};

const $container: ViewStyle = {
  height: layout.headerHeight,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const $centerTitle: TextStyle = {
  position: 'absolute',
  width: '100%',
  textAlign: 'center',
  paddingHorizontal: spacing.huge,
  zIndex: 1,
};

const $flexTitle: TextStyle = {
  flex: 1,
  textAlign: 'center',
};

const $actionTextContainer: ViewStyle = {
  flexGrow: 0,
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  paddingHorizontal: spacing.medium,
  zIndex: 2,
};

const $actionText: TextStyle = {
  color: colors.tint,
};

const $actionIconContainer: ViewStyle = {
  flexGrow: 0,
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  paddingHorizontal: spacing.medium,
  zIndex: 2,
};

const $actionFillerContainer: ViewStyle = {
  width: 16,
};
