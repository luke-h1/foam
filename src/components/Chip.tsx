/* eslint-disable no-shadow */
import {
  BackgroundColorProps,
  BorderProps,
  LayoutProps,
  OpacityProps,
  SpacingProps,
  backgroundColor,
  border,
  composeRestyleFunctions,
  createRestyleComponent,
  layout,
  opacity,
  spacing,
  useRestyle,
} from '@shopify/restyle';
import { ReactNode } from 'react';
import { Pressable, PressableProps } from 'react-native';
import { Theme } from '../styles/theme';
import Box from './Box';
import Text from './Text';

enum ChipColors {
  Primary = 'primary',
  PrimaryOutline = 'primaryOutline',
  PrimaryText = 'primaryText',
}
export enum ChipVariants {
  Contained = 'contained',
  Text = 'text',
}

export enum ChipSizes {
  Small = 'small',
  Medium = 'medium',
}

export type ChipPaddingData = {
  [size in ChipSizes]: keyof Theme['spacing'];
};

export interface ChipBaseContrastColors {
  background: keyof Theme['colors'];
  text: keyof Theme['colors'];
}

export type ChipColorsData = {
  [color in ChipColors]: {
    regular: ChipBaseContrastColors;
    disabled?: ChipBaseContrastColors;
  };
};

type RestyleProps = SpacingProps<Theme> &
  LayoutProps<Theme> &
  OpacityProps<Theme> &
  BackgroundColorProps<Theme>;

interface ChipProps
  extends SpacingProps<Theme>,
    LayoutProps<Theme>,
    BorderProps<Theme>,
    OpacityProps<Theme>,
    BackgroundColorProps<Theme>,
    Omit<PressableProps, 'style'> {
  disabled?: boolean;
  children: ReactNode | string;
  color?: ChipColors;
  variant?: ChipVariants;
  // eslint-disable-next-line react/no-unused-prop-types
  size?: ChipSizes;
  isBold?: boolean;
}

const chipColors: ChipColorsData = {
  [ChipColors.Primary]: {
    regular: {
      background: 'defaultButton',
      text: 'white',
    },
    disabled: {
      background: 'disabledButtonBackground',
      text: 'disabledButtonText',
    },
  },
  [ChipColors.PrimaryOutline]: {
    regular: {
      background: 'highlightBackground',
      text: 'secondaryText',
    },
    disabled: {
      background: 'highlightBackground',
      text: 'disabledButtonBackground',
    },
  },
  [ChipColors.PrimaryText]: {
    regular: {
      background: 'transparent',
      text: 'primaryText',
    },
    disabled: {
      background: 'transparent',
      text: 'primaryText',
    },
  },
};

const getChipBackgroundColor = ({
  disabled,
  color = ChipColors.Primary,
}: Pick<ChipProps, 'disabled' | 'color'>): keyof Theme['colors'] => {
  const colors = chipColors[color];
  return disabled && colors.disabled
    ? colors.disabled.background
    : colors.regular.background;
};

const getChipTextColor = ({
  disabled,
  color = ChipColors.Primary,
}: Pick<
  ChipProps,
  'disabled' | 'color' | 'variant'
>): keyof Theme['colors'] => {
  const colors = chipColors[color];
  return disabled && colors.disabled
    ? colors.disabled.text
    : colors.regular.text;
};

const BUTTON_HORIZONTAL_PADDING: ChipPaddingData = {
  [ChipSizes.Small]: 's',
  [ChipSizes.Medium]: 'l',
};

const BUTTON_VERTICAL_PADDING: ChipPaddingData = {
  [ChipSizes.Small]: 'xxxs',
  [ChipSizes.Medium]: 'sToM',
};

const Content = ({
  disabled,
  children,
  color = ChipColors.Primary,
  variant = ChipVariants.Text,
  isBold = true,
}: ChipProps) => {
  const buttonTextColor = getChipTextColor({ disabled, color, variant });

  return (
    <Box>
      {typeof children === 'string' ? (
        <Text
          testID="chipText"
          fontSize={13}
          lineHeight={14}
          textAlign="center"
          fontFamily={isBold ? 'Roboto-Bold' : 'Roboto-Regular'}
          color={buttonTextColor}
        >
          {children}
        </Text>
      ) : (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>{children}</>
      )}
    </Box>
  );
};

const Chip = ({
  onPress,
  disabled,
  children,
  color = ChipColors.Primary,
  variant,
  size = ChipSizes.Small,
  isBold,
  ...props
}: ChipProps) => {
  const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
    spacing,
    layout,
    opacity,
    backgroundColor,
  ]);

  const Component = createRestyleComponent<ChipProps, Theme>(
    [spacing, layout, border, opacity, backgroundColor],
    Pressable,
  );

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rootProps = useRestyle(restyleFunctions, props);

  const buttonBackgroundColor = getChipBackgroundColor({ disabled, color });

  return (
    <Component
      testID="chip"
      backgroundColor={buttonBackgroundColor}
      paddingHorizontal={BUTTON_HORIZONTAL_PADDING[size]}
      paddingVertical={BUTTON_VERTICAL_PADDING[size]}
      borderRadius="sToM"
      {...{ onPress }}
      {...rootProps}
    >
      <Content
        {...{
          disabled,
          children,
          color,
          variant,
          isBold,
        }}
      />
    </Component>
  );
};
export default Chip;
