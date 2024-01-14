import { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { GetProps, styled, Text as TamaguiText } from 'tamagui';
import { withAnimated } from '../hocs/withAnimated';
import { fonts } from '../styles';
import { Flex } from './Flex';
import VisuallyHidden from './VisuallyHidden';
import Skeleton from './loading/Skeleton';

export const DEFAULT_FONT_SCALE = 1;

export const TextFrame = styled(TamaguiText, {
  wordWrap: 'break-word',
  variants: {
    // TODO: leverage font tokens instead
    // https://tamagui.dev/docs/core/configuration#font-tokens
    // https://tamagui.dev/docs/core/font-language

    variant: {
      heading1: {
        fontFamily: '$heading',
        fontSize: fonts.heading1.fontSize,
        lineHeight: fonts.heading1.lineHeight,
        fontWeight: fonts.heading1.fontWeight,
        maxFontSizeMultiplier: fonts.heading1.maxFontSizeMultiplier,
      },
      heading2: {
        fontFamily: '$heading',
        fontSize: fonts.heading2.fontSize,
        lineHeight: fonts.heading2.lineHeight,
        fontWeight: fonts.heading2.fontWeight,
        maxFontSizeMultiplier: fonts.heading2.maxFontSizeMultiplier,
      },
      heading3: {
        fontFamily: '$heading',
        fontSize: fonts.heading3.fontSize,
        lineHeight: fonts.heading3.lineHeight,
        fontWeight: fonts.heading3.fontWeight,
        maxFontSizeMultiplier: fonts.heading3.maxFontSizeMultiplier,
      },
      subheading1: {
        fontFamily: '$subHeading',
        fontSize: fonts.subheading1.fontSize,
        lineHeight: fonts.subheading1.lineHeight,
        fontWeight: fonts.subheading1.fontWeight,
        maxFontSizeMultiplier: fonts.subheading1.maxFontSizeMultiplier,
      },
      subheading2: {
        fontFamily: '$subHeading',
        fontSize: fonts.subheading2.fontSize,
        lineHeight: fonts.subheading2.lineHeight,
        fontWeight: fonts.subheading2.fontWeight,
        maxFontSizeMultiplier: fonts.subheading2.maxFontSizeMultiplier,
      },
      body1: {
        fontFamily: '$body',
        fontSize: fonts.body1.fontSize,
        lineHeight: fonts.body1.lineHeight,
        fontWeight: fonts.body1.fontWeight,
        maxFontSizeMultiplier: fonts.body1.maxFontSizeMultiplier,
      },
      body2: {
        fontFamily: '$body',
        fontSize: fonts.body2.fontSize,
        lineHeight: fonts.body2.lineHeight,
        fontWeight: fonts.body2.fontWeight,
        maxFontSizeMultiplier: fonts.body2.maxFontSizeMultiplier,
      },
      body3: {
        fontFamily: '$body',
        fontSize: fonts.body3.fontSize,
        lineHeight: fonts.body3.lineHeight,
        fontWeight: fonts.body3.fontWeight,
        maxFontSizeMultiplier: fonts.body3.maxFontSizeMultiplier,
      },
      buttonLabel1: {
        fontFamily: '$button',
        fontSize: fonts.buttonLabel1.fontSize,
        lineHeight: fonts.buttonLabel1.lineHeight,
        fontWeight: fonts.buttonLabel1.fontWeight,
        maxFontSizeMultiplier: fonts.buttonLabel1.maxFontSizeMultiplier,
      },
      buttonLabel2: {
        fontFamily: '$button',
        fontSize: fonts.buttonLabel2.fontSize,
        lineHeight: fonts.buttonLabel2.lineHeight,
        fontWeight: fonts.buttonLabel2.fontWeight,
        maxFontSizeMultiplier: fonts.buttonLabel2.maxFontSizeMultiplier,
      },
      buttonLabel3: {
        fontFamily: '$button',
        fontSize: fonts.buttonLabel3.fontSize,
        lineHeight: fonts.buttonLabel3.lineHeight,
        fontWeight: fonts.buttonLabel3.fontWeight,
        maxFontSizeMultiplier: fonts.buttonLabel3.maxFontSizeMultiplier,
      },
      buttonLabel4: {
        fontFamily: '$button',
        fontSize: fonts.buttonLabel4.fontSize,
        lineHeight: fonts.buttonLabel4.lineHeight,
        fontWeight: fonts.buttonLabel4.fontWeight,
        maxFontSizeMultiplier: fonts.buttonLabel4.maxFontSizeMultiplier,
      },
      monospace: {
        fontFamily: '$body',
        fontSize: fonts.body2.fontSize,
        lineHeight: fonts.body2.lineHeight,
        fontWeight: fonts.body2.fontWeight,
        maxFontSizeMultiplier: fonts.body2.maxFontSizeMultiplier,
      },
    },
  } as const,
  defaultVariants: {
    variant: 'body2',
  },
});

type TextFrameProps = GetProps<typeof TextFrame>;

// Use this text component throughout the app instead of
// Default RN Text for theme support

// const ThemedAnimatedText = createText<Theme>(Animated.Text)

export const TextPlaceholder = ({ children }: { children: ReactNode }) => {
  return (
    <Flex row alignItems="center">
      <Flex row alignItems="center" position="relative">
        <VisuallyHidden>{children}</VisuallyHidden>
        <Flex
          backgroundColor="$surface2"
          borderRadius="$rounded4"
          bottom="5%"
          left={0}
          position="absolute"
          right={0}
          top="5%"
        />
      </Flex>
    </Flex>
  );
};

interface TextLoaderWrapperProps {
  children: ReactNode;
  loadingShimmer?: boolean;
}

export const TextLoaderWrapper = ({
  children,
  loadingShimmer,
}: TextLoaderWrapperProps) => {
  const inner = <TextPlaceholder>{children}</TextPlaceholder>;

  if (loadingShimmer) {
    return <Skeleton>{inner}</Skeleton>;
  }
  return inner;
};

/**
 * Text component used in favor of RN Text so we can have theming support
 */

export type TextProps = TextFrameProps & {
  maxFontSizeMultiplier?: number;
  allowFontScaling?: boolean;
  loading?: boolean | 'no-shimmer';
  loadingPlaceholderText?: string;
};

export const Text = ({
  loading = false,
  allowFontScaling,
  loadingPlaceholderText = '...',
  ...rest
}: TextProps) => {
  const { fontScale } = useWindowDimensions();
  const enableFontScaling = allowFontScaling ?? fontScale > DEFAULT_FONT_SCALE;

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <TextFrame
          allowFontScaling={enableFontScaling}
          color="$transparent"
          opacity={0}
          {...rest}
        >
          {/* Important that `children` isn't used or rendered by <Text> when `loading` is true, because if the child of a <Text> component is a dynamic variable that might not be finished fetching yet, it'll result in an error until it's finished loading. We use `loadingPlaceholderText` to set the size of the loading element instead. */}
          {loadingPlaceholderText}
        </TextFrame>
      </TextLoaderWrapper>
    );
  }
  return (
    <TextFrame
      allowFontScaling={enableFontScaling}
      color="$neutral1"
      {...rest}
    />
  );
};
// TODO: make Text able to take animated styles
export const AnimatedText = withAnimated(TextFrame);
