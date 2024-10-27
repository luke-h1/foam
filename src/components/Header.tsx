import { useAppTheme } from '@app/context/ThemeContext';
import {
  ExtendedEdge,
  useSafeAreaInsetsStyle,
} from '@app/hooks/useSafeAreaInsetsStyle';
import { ThemedStyle, styles as themeStyles } from '@app/theme';
import { ComponentType, ReactElement } from 'react';
import {
  StyleProp,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Text, { TextProps } from './Text';

export interface HeaderProps {
  /**
   * The layout of the title relative to the action components.
   * - `center` will force the title to always be centered relative to the header. If the title or the action buttons are too long, the title will be cut off.
   * - `flex` will attempt to center the title relative to the action buttons. If the action buttons are different widths, the title will be off-center relative to the header.
   */
  titleMode?: 'center' | 'flex';
  titleStyle?: StyleProp<TextStyle>;
  titleContainerStyle?: StyleProp<TextStyle>;
  /**
   * inner header wrapper style override
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Optional outer header container style override
   */
  containerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  title?: TextProps['text'];
  /**
   * Vector icon that should appear on the left.
   * Can be used with `onLeftPress`.
   */
  leftIcon?: string;
  /**
   * An optional tint color for the left icon
   */
  leftIconColor?: string;

  /**
   * Left action text to display
   * Can be used with `onLeftPress`. Overrides `leftIcon`.
   */
  leftText?: TextProps['text'];
  /**
   * Left action custom ReactElement if the built in action props don't suffice.
   * Overrides `leftIcon` and `leftText`.
   */
  LeftActionComponent?: ReactElement;
  /**
   * What happens when you press the left icon or text action.
   */
  onLeftPress?: TouchableOpacityProps['onPress'];
  /**
   * Vector icon that should appear on the right.
   * Can be used with `onRightPress`.
   */
  rightIcon?: string;
  /**
   * An optional tint color for the right icon
   */
  rightIconColor?: string;
  /**
   * Right action text to display
   * Can be used with `onRightPress`. Overrides `rightIcon`.
   */
  rightText?: TextProps['text'];
  /**
   * Right action custom ReactElement if the built in action props don't suffice.
   * Overrides `rightIcon` and `rightText`.
   */
  RightActionComponent?: ReactElement;
  /**
   * What happens when you press the right icon or text action.
   */
  onRightPress?: TouchableOpacityProps['onPress'];
  /**
   * Override the default edges for the safe area.
   */
  safeAreaEdges?: ExtendedEdge[];
}

export default function Header(props: HeaderProps) {
  const { theme, themed } = useAppTheme();

  const { colors } = theme;

  const {
    backgroundColor = colors.background,
    LeftActionComponent,
    leftIcon,
    leftIconColor,
    leftText,
    leftTx,
    leftTxOptions,
    onLeftPress,
    onRightPress,
    RightActionComponent,
    rightIcon,
    rightIconColor,
    rightText,
    rightTx,
    rightTxOptions,
    safeAreaEdges = ['top'],
    title,
    titleMode = 'center',
    titleTx,
    titleTxOptions,
    titleContainerStyle: titleContainerStyleOverride,
    style: styleOverride,
    titleStyle: titleStyleOverride,
    containerStyle: containerStyleOverride,
  } = props;

  const containerInsets = useSafeAreaInsetsStyle(safeAreaEdges);

  return (
    <View
      style={[
        styles.container,
        containerInsets,
        { backgroundColor },
        containerStyleOverride,
      ]}
    >
      <View style={[themeStyles.row, styles.wrapper, styleOverride]} />
    </View>
  );
}

interface HeaderActionProps {
  backgroundColor?: string;
  icon?: string;
  iconColor?: string;
  text?: TextProps['text'];
  onPress?: TouchableOpacityProps['onPress'];
  ActionComponent?: ReactElement;
}

function HeaderAction({
  backgroundColor,
  icon,
  text,
  onPress,
  ActionComponent,
  iconColor,
}: HeaderActionProps) {
  const { themed } = useAppTheme();

  if (ActionComponent) {
    return ActionComponent;
  }

  if (text) {
    return (
      <TouchableOpacity
        style={themed([actionIconContainer, { backgroundColor }])}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        <Text
          weight="medium"
          size="md"
          text={text}
          style={themed(actionText)}
        />
      </TouchableOpacity>
    );
  }

  const Wrapper = (onPress ? TouchableOpacity : View) as ComponentType<
    TouchableOpacityProps | ViewProps
  >;

  if (icon) {
    return (
      <Wrapper
        accessibilityRole={onPress ? 'imagebutton' : undefined}
        style={themed([actionIconContainer, { backgroundColor }])}
      >
        <Icon name={icon} size={24} color={iconColor} />
      </Wrapper>
    );
  }

  return <View style={[styles.actionFillerContainer, { backgroundColor }]} />;
}

const actionTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 0,
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  paddingHorizontal: spacing.md,
  zIndex: 2,
});

const actionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
});

const actionIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 0,
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  paddingHorizontal: spacing.md,
  zIndex: 2,
});

const titleWrapperCenter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  paddingHorizontal: spacing.xxl,
  zIndex: 1,
});

const styles = StyleSheet.create<{
  wrapper: ViewStyle;
  container: ViewStyle;
  title: TextStyle;
  actionFillerContainer: ViewStyle;
  titleWrapperFlex: ViewStyle;
}>({
  wrapper: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  container: {
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  actionFillerContainer: {
    width: 16,
  },
  titleWrapperFlex: {
    justifyContent: 'center',
    flexGrow: 1,
  },
});
