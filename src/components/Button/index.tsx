/* eslint-disable no-shadow */
import {
  BorderProps,
  ColorProps,
  VariantProps,
  backgroundColor,
  border,
  composeRestyleFunctions,
  createRestyleComponent,
  layout,
  opacity,
  spacing,
  TextProps as RestyleTextProps,
  useRestyle,
  BackgroundColorProps,
  LayoutProps,
  OpacityProps,
  SpacingProps,
} from '@shopify/restyle';
import { FC, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ViewProps,
  ViewStyle,
  TextProps as RNTextProps,
} from 'react-native';

import { SvgProps } from 'react-native-svg';
import { Theme } from '../../styles/theme';
import Box from '../Box';
import SVGIcon from '../SVGIcon';
import Text from '../Text';

export interface SvgIconProps
  extends ColorProps<Theme>,
    SpacingProps<Theme>,
    LayoutProps<Theme>,
    OpacityProps<Theme>,
    Pick<ViewProps, 'testID'> {
  icon: FC<SvgProps>;
  style?: ViewStyle;
}

type RestyleProps = SpacingProps<Theme> &
  LayoutProps<Theme> &
  OpacityProps<Theme> &
  BackgroundColorProps<Theme>;

enum ButtonColors {
  Primary = 'primary',
  PrimaryOutline = 'primaryOutline',
  PrimaryText = 'primaryText',
  PrimaryOutlineText = 'primaryOutlineText',
  PrimaryHighlight = 'PrimaryHighlight',
  HighlightedText = 'HighlightedText',
}

export enum ButtonVariants {
  Contained = 'contained',
  Text = 'text',
}

export enum ButtonSizes {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export const BUTTONS_COLORS = Object.freeze<ButtonColorsData>({
  [ButtonColors.Primary]: {
    regular: {
      background: 'defaultButton',
      text: 'white',
    },
    disabled: {
      background: 'disabledButtonBackground',
      text: 'disabledButtonText',
    },
  },
  [ButtonColors.PrimaryOutline]: {
    regular: {
      background: 'highlightBackground',
      text: 'defaultButton',
    },
    disabled: {
      background: 'highlightBackground',
      text: 'disabledButtonBackground',
    },
  },
  [ButtonColors.PrimaryText]: {
    regular: {
      background: 'transparent',
      text: 'primaryText',
    },
    disabled: {
      background: 'transparent',
      text: 'primaryText',
    },
  },
  [ButtonColors.PrimaryOutlineText]: {
    regular: {
      background: 'highlightBackground',
      text: 'primaryText',
    },
    disabled: {
      background: 'highlightBackground',
      text: 'secondaryText',
    },
  },
  [ButtonColors.PrimaryHighlight]: {
    regular: {
      background: 'twitchPurple',
      text: 'primaryText',
    },
    disabled: {
      background: 'highlightBackground',
      text: 'secondaryText',
    },
  },
  [ButtonColors.HighlightedText]: {
    regular: {
      background: 'transparent',
      text: 'defaultButton',
    },
    disabled: {
      background: 'transparent',
      text: 'gray4',
    },
  },
});

export const getButtonBackgroundColor = ({
  disabled,
  color = ButtonColors.Primary,
}: Pick<ButtonProps, 'disabled' | 'color'>): keyof Theme['colors'] => {
  const colors = BUTTONS_COLORS[color];
  return disabled && colors.disabled
    ? colors.disabled.background
    : colors.regular.background;
};

export const getButtonTextColor = ({
  disabled,
  color = ButtonColors.Primary,
}: Pick<
  ButtonProps,
  'disabled' | 'color' | 'variant'
>): keyof Theme['colors'] => {
  const colors = BUTTONS_COLORS[color];
  return disabled && colors.disabled
    ? colors.disabled.text
    : colors.regular.text;
};

export const BUTTON_HORIZONTAL_PADDING = Object.freeze<ButtonPaddingData>({
  [ButtonSizes.Small]: 'sToM',
  [ButtonSizes.Medium]: 'l',
  [ButtonSizes.Large]: 'sToM',
});

export const BUTTON_VERTICAL_PADDING = Object.freeze<ButtonPaddingData>({
  [ButtonSizes.Small]: 'xs',
  [ButtonSizes.Medium]: 'sToM',
  [ButtonSizes.Large]: 'xs',
});

export type ButtonPaddingData = {
  [size in ButtonSizes]: keyof Theme['spacing'];
};

export interface ButtonBaseContrastColors {
  background: keyof Theme['colors'];
  text: keyof Theme['colors'];
}

export type ButtonColorsData = {
  [color in ButtonColors]: {
    regular: ButtonBaseContrastColors;
    disabled?: ButtonBaseContrastColors;
  };
};

type TextProps = VariantProps<Theme, 'textVariants'> &
  SpacingProps<Theme> &
  LayoutProps<Theme> &
  ColorProps<Theme> &
  BackgroundColorProps<Theme> &
  RestyleTextProps<Theme> &
  RNTextProps;

export interface ButtonProps
  extends SpacingProps<Theme>,
    LayoutProps<Theme>,
    BorderProps<Theme>,
    OpacityProps<Theme>,
    BackgroundColorProps<Theme>,
    Omit<PressableProps, 'style'> {
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  color?: ButtonColors;
  variant?: ButtonVariants;
  size?: ButtonSizes;
  isBold?: boolean;
  textProps?: TextProps;
  beforeIcon?: SvgIconProps['icon'];
  afterIcon?: SvgIconProps['icon'];
  beforeElement?: ReactNode;
  afterElement?: ReactNode;
}

const Content = ({
  loading,
  disabled,
  children,
  color = ButtonColors.Primary,
  variant = ButtonVariants.Text,
  isBold = true,
  textProps,
  beforeIcon,
  afterIcon,
  beforeElement,
  afterElement,
  size,
}: ButtonProps) => {
  const isChildrenString = typeof children === 'string';

  const buttonTextColor = getButtonTextColor({ disabled, color, variant });
  const buttonTextSize = size === ButtonSizes.Large ? 18 : 16;

  if (loading) {
    return (
      <Box paddingVertical="m">
        <ActivityIndicator testID="loading" size={24} color="#fff" />
      </Box>
    );
  }

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="center">
      {beforeElement && <Box>{beforeElement}</Box>}
      {beforeIcon && (
        <SVGIcon
          icon={beforeIcon}
          width={16}
          height={16}
          color="primaryText"
          marginRight="s"
        />
      )}
      {isChildrenString ? (
        <Text
          flex={1}
          testID="buttonText"
          fontSize={buttonTextSize}
          textAlign="center"
          alignSelf="center"
          fontFamily={isBold ? 'Roboto-Bold' : 'Roboto-Regular'}
          color={buttonTextColor}
          {...textProps}
        >
          {children}
        </Text>
      ) : (
        <Box testID="buttonChildren">{children}</Box>
      )}
      {afterIcon && (
        <SVGIcon
          icon={afterIcon}
          width={16}
          height={16}
          color="primaryText"
          marginRight="s"
        />
      )}
      {afterElement && <Box>{afterElement}</Box>}
    </Box>
  );
};

const Button = ({
  onPress,
  loading,
  disabled,
  children,
  color = ButtonColors.Primary,
  variant,
  size = ButtonSizes.Small,
  isBold,
  textProps,
  beforeIcon,
  afterIcon,
  beforeElement,
  afterElement,
  ...props
}: ButtonProps) => {
  const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
    spacing,
    layout,
    opacity,
    backgroundColor,
  ]);

  const Component = createRestyleComponent<ButtonProps, Theme>(
    [spacing, layout, border, opacity, backgroundColor],
    Pressable,
  );

  const rootProps = useRestyle(restyleFunctions, props);

  const buttonBackgroundColor = getButtonBackgroundColor({
    disabled,
    color,
  });

  return (
    <Component
      testID="button"
      backgroundColor={buttonBackgroundColor}
      paddingHorizontal={BUTTON_HORIZONTAL_PADDING[size]}
      paddingVertical={BUTTON_VERTICAL_PADDING[size]}
      borderRadius="m"
      {...(size === ButtonSizes.Large && { width: 175 })}
      {...{ onPress }}
      {...rootProps}
    >
      <Content
        {...{
          loading,
          disabled,
          children,
          color,
          variant,
          size,
          isBold,
          textProps,
          beforeIcon,
          afterIcon,
          beforeElement,
          afterElement,
        }}
      />
    </Component>
  );
};

export default Button;
