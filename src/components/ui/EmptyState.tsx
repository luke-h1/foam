/* eslint-disable no-shadow */
import { spacing } from '@app/styles';
import {
  ImageProps,
  ImageStyle,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Button, { ButtonProps } from './Button';
import { Text, TextProps } from './Text';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const empty = require('../../../assets/sad-face.png');

interface EmptyStatePresetItem {
  imageSource: ImageProps['source'];
  heading: TextProps['text'];
  content: TextProps['text'];
  button: TextProps['text'];
}

const EmptyStatePresets = {
  generic: {
    imageSource: empty,
    heading: 'Empty',
    content: 'No data found, click the button to refresh or reload the app',
    button: "Let's try this again",
  } as EmptyStatePresetItem,
} as const;

interface EmptyStateProps {
  /**
   * An optional prop that specifies the text/image set to use for the empty state
   */
  preset?: keyof typeof EmptyStatePresets;

  /**
   * Style override for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * An Image source to be displayed above the heading
   */
  imageSource?: ImageProps['source'];

  /**
   * Style overrides for image.
   */
  imageStyle?: StyleProp<ImageStyle>;
  /**
   * Pass any additional props directly to the Image component.
   */
  ImageProps?: Omit<ImageProps, 'source'>;
  /**
   * The heading text to display if not using `headingTx`.
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
   * The content text to display if not using `contentTx`.
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
   * The button text to display if not using `buttonTx`.
   */
  button?: TextProps['text'];

  /**
   * Style overrides for button.
   */
  buttonStyle?: ButtonProps['style'];
  /**
   * Style overrides for button text.
   */
  buttonTextStyle?: ButtonProps['textStyle'];
  /**
   * Called when the button is pressed.
   */
  buttonOnPress?: ButtonProps['onPress'];
  /**
   * Pass any additional props directly to the Button component.
   */
  ButtonProps?: ButtonProps;
}

/**
 * A component to use when there is no data to display. It can be utilized to direct the user what to do next.
 * @param {EmptyStateProps} props - The props for the `EmptyState` component.
 * @returns {JSX.Element} The rendered `EmptyState` component.
 */

export default function EmptyState(props: EmptyStateProps) {
  // eslint-disable-next-line react/destructuring-assignment
  const preset = EmptyStatePresets[props.preset ?? 'generic'];

  const {
    button = preset.button,
    buttonOnPress,
    content = preset.content,
    heading = preset.heading,
    imageSource = preset.imageSource,
    style: $containerStyleOverride,
    contentStyle: $contentStyleOverride,
    headingStyle: $headingStyleOverride,
    ButtonProps,
    ContentTextProps,
    HeadingTextProps,
  } = props;

  const isImagePresent = !!imageSource;
  const isHeadingPresent = !!heading;
  const isContentPresent = !!content;
  const isButtonPresent = !!button;

  const $containerStyles = [$containerStyleOverride];

  const $headingStyles = [
    $heading,
    isImagePresent && { marginTop: spacing.micro },
    (isContentPresent || isButtonPresent) && { marginBottom: spacing.micro },
    $headingStyleOverride,
    HeadingTextProps?.style,
  ];
  const $contentStyles = [
    $content,
    (isImagePresent || isHeadingPresent) && { marginTop: spacing.micro },
    isButtonPresent && { marginBottom: spacing.micro },
    $contentStyleOverride,
    ContentTextProps?.style,
  ];

  return (
    <View style={$containerStyles}>
      {isHeadingPresent && (
        <Text
          preset="subheading"
          text={heading}
          {...HeadingTextProps}
          style={$headingStyles}
        />
      )}

      {isContentPresent && (
        <Text
          text={content}
          {...ContentTextProps}
          style={[
            $contentStyles,
            {
              marginBottom: 15,
            },
          ]}
        />
      )}

      {isButtonPresent && (
        <Button onPress={buttonOnPress} text={button} {...ButtonProps} />
      )}
    </View>
  );
}

const $heading: TextStyle = {
  textAlign: 'center',
  paddingHorizontal: spacing.large,
};
const $content: TextStyle = {
  textAlign: 'center',
  paddingHorizontal: spacing.large,
};
