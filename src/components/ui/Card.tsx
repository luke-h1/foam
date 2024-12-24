import { colors, spacing } from '@app/styles';
import React, { ComponentType, Fragment, ReactElement } from 'react';
import {
  StyleProp,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import BoxShadow from './BoxShadow';
import { Text, TextProps } from './Text';

type Presets = keyof typeof $containerPresets;

interface CardProps extends TouchableOpacityProps {
  preset?: Presets;

  /**
   * How the content should be aligned vertically. This is especially (but not exclusively) useful
   * when the card is a fixed height but the content is dynamic.
   *
   * `top` (default) - aligns all content to the top.
   * `center` - aligns all content to the center.
   * `space-between` - spreads out the content evenly.
   * `force-footer-bottom` - aligns all content to the top, but forces the footer to the bottom.
   */
  verticalAlignment?:
    | 'top'
    | 'center'
    | 'space-between'
    | 'force-footer-bottom';
  /**
   * Custom component added to the left of the card body.
   */
  LeftComponent?: ReactElement;
  /**
   * Custom component added to the right of the card body.
   */
  RightComponent?: ReactElement;
  /**
   * The heading text to display
   */
  heading?: TextProps['text'];

  /**
   * Style overrides for heading text.
   */
  headingStyle?: StyleProp<TextStyle>;
  /**
   * Pass any additional props directly to the heading Text component.
   */
  HeadingTextProps?: TextProps;
  /**
   * Custom heading component.
   * Overrides all other `heading*` props.
   */
  HeadingComponent?: ReactElement;
  /**
   * The content text to display
   */
  content?: TextProps['text'];
  /**
   * Style overrides for content text.
   */
  contentStyle?: StyleProp<TextStyle>;
  /**
   * Pass any additional props directly to the content Text component.
   */
  ContentTextProps?: TextProps;
  /**
   * Custom content component.
   * Overrides all other `content*` props.
   */
  ContentComponent?: ReactElement;
  /**
   * The footer text to display
   */
  footer?: TextProps['text'];

  /**
   * Style overrides for footer text.
   */
  footerStyle?: StyleProp<TextStyle>;
  /**
   * Pass any additional props directly to the footer Text component.
   */
  FooterTextProps?: TextProps;
  /**
   * Custom footer component.
   * Overrides all other `footer*` props.
   */
  FooterComponent?: ReactElement;
}

/**
 * Cards are useful for displaying related information in a contained way.
 * If a ListItem displays content horizontally, a Card can be used to display content vertically.
 */

export default function Card({
  content,
  footer,
  heading,
  ContentComponent,
  HeadingComponent,
  FooterComponent,
  LeftComponent,
  RightComponent,
  verticalAlignment = 'top',
  style: $containerStyleOverride,
  contentStyle: $contentStyleOverride,
  headingStyle: $headingStyleOverride,
  footerStyle: $footerStyleOverride,
  ContentTextProps,
  HeadingTextProps,
  preset: defaultPreset,
  FooterTextProps,
  ...WrapperProps
}: CardProps) {
  const preset: Presets = defaultPreset ?? 'default';

  const isPressable = !!WrapperProps.onPress;
  const isHeadingPresent = !!(HeadingComponent || heading);
  const isContentPresent = !!(ContentComponent || content);
  const isFooterPresent = !!(FooterComponent || footer);

  const Wrapper: ComponentType<TouchableOpacityProps> = (
    isPressable ? TouchableOpacity : View
  ) as ComponentType<TouchableOpacityProps>;

  const HeaderContentWrapper =
    verticalAlignment === 'force-footer-bottom' ? View : Fragment;

  const $containerStyle = [$containerPresets[preset], $containerStyleOverride];
  const $headingStyle = [
    $headingPresets[preset],
    (isFooterPresent || isContentPresent) && { marginBottom: spacing.micro },
    $headingStyleOverride,
    HeadingTextProps?.style,
  ];
  const $contentStyle = [
    $contentPresets[preset],
    isHeadingPresent && { marginTop: spacing.micro },
    isFooterPresent && { marginBottom: spacing.micro },
    $contentStyleOverride,
    ContentTextProps?.style,
  ];
  const $footerStyle = [
    $footerPresets[preset],
    (isHeadingPresent || isContentPresent) && { marginTop: spacing.micro },
    $footerStyleOverride,
    FooterTextProps?.style,
  ];
  const $alignmentWrapperStyle = [
    $alignmentWrapper,
    { justifyContent: $alignmentWrapperFlexOptions[verticalAlignment] },
    LeftComponent && { marginStart: spacing.medium },
    RightComponent && { marginEnd: spacing.medium },
  ];

  return (
    <BoxShadow
      preset={
        // eslint-disable-next-line no-nested-ternary
        preset === 'default'
          ? 'primary'
          : // eslint-disable-next-line no-nested-ternary
            preset === 'pastDefault'
            ? 'secondary'
            : preset === 'pastReversed'
              ? 'reversed'
              : 'default'
      }
    >
      <Wrapper
        style={$containerStyle}
        activeOpacity={0.8}
        accessibilityRole={isPressable ? 'button' : undefined}
        {...WrapperProps}
      >
        {LeftComponent}

        <View style={$alignmentWrapperStyle}>
          <HeaderContentWrapper>
            {HeadingComponent ||
              (isHeadingPresent && (
                <Text
                  weight="bold"
                  text={heading}
                  {...HeadingTextProps}
                  style={$headingStyle}
                />
              ))}

            {ContentComponent ||
              (isContentPresent && (
                <Text
                  weight="book"
                  text={content}
                  {...ContentTextProps}
                  style={$contentStyle}
                />
              ))}
          </HeaderContentWrapper>
          {FooterComponent ||
            (isFooterPresent && (
              <Text
                weight="book"
                size="xs"
                text={footer}
                {...FooterTextProps}
                style={$footerStyle}
              />
            ))}
        </View>
        {RightComponent}
      </Wrapper>
    </BoxShadow>
  );
}

const $containerBase: ViewStyle = {
  paddingVertical: spacing.extraLarge,
  paddingHorizontal: spacing.large,
  borderWidth: 1,
  flexDirection: 'row',
};

const $alignmentWrapper: ViewStyle = {
  flex: 1,
  alignSelf: 'auto',
};

const $alignmentWrapperFlexOptions = {
  top: 'flex-start',
  center: 'center',
  'space-between': 'space-between',
  'force-footer-bottom': 'space-between',
} as const;

const $containerPresets = {
  default: [
    $containerBase,
    {
      backgroundColor: colors.palette.neutral700,
      borderColor: colors.palette.neutral700,
    },
  ] as StyleProp<ViewStyle>,

  reversed: [
    $containerBase,
    {
      backgroundColor: colors.palette.primary100,
      borderColor: colors.palette.primary500,
    },
  ] as StyleProp<ViewStyle>,

  pastDefault: [
    $containerBase,
    {
      backgroundColor: colors.palette.neutral700,
      borderCcolor: colors.palette.neutral400,
    },
  ] as StyleProp<ViewStyle>,

  pastReversed: [
    $containerBase,
    {
      backgroundColor: colors.palette.neutral400,
      borderColor: colors.palette.neutral400,
    },
  ] as StyleProp<ViewStyle>,
};

const $headingPresets: Record<Presets, TextStyle> = {
  default: {},
  reversed: { color: colors.palette.neutral100 },
  pastDefault: {},
  pastReversed: {},
};

const $contentPresets: Record<Presets, TextStyle> = {
  default: {},
  reversed: { color: colors.palette.neutral100 },
  pastDefault: {},
  pastReversed: {},
};

const $footerPresets: Record<Presets, TextStyle> = {
  default: {},
  reversed: { color: colors.palette.neutral100 },
  pastDefault: {},
  pastReversed: {},
};
