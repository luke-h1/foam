/* eslint-disable no-shadow */
import {
  ImageProps,
  ImageStyle,
  SafeAreaView,
  StyleProp,
  TextProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button, ButtonProps } from '../Button';
import { Typography } from '../Typography';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const empty = require('../../../assets/sad-face.png');

interface EmptyStatePresetItem {
  imageSource: ImageProps['source'];
  heading: TextProps['children'];
  content: TextProps['children'];
  button: TextProps['children'];
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
  heading?: TextProps['children'];

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
  content?: TextProps['children'];

  /**
   * Style overrides for content text.
   */
  contentStyle?: StyleProp<TextStyle>;
  /**
   * Pass any additional props directly to the content Text component.
   */
  ContentTextProps?: TextProps;
  /**
   * The button text to display
   */
  button?: TextProps['children'];

  /**
   * Style overrides for button.
   */
  buttonStyle?: ButtonProps['style'];
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

export function EmptyState(props: EmptyStateProps) {
  // eslint-disable-next-line react/destructuring-assignment
  const preset = EmptyStatePresets[props.preset ?? 'generic'];

  const { styles } = useStyles(styleSheet);

  const {
    button = preset.button,
    buttonOnPress,
    content = preset.content,
    heading = preset.heading,
    imageSource = preset.imageSource,
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

  return (
    <SafeAreaView
      style={styles.container($contentStyleOverride as StyleProp<ViewStyle>)}
    >
      {isHeadingPresent && (
        <Typography
          {...HeadingTextProps}
          style={styles.heading(
            $headingStyleOverride,
            isImagePresent,
            isHeadingPresent,
            isContentPresent,
            HeadingTextProps,
          )}
        >
          {heading}
        </Typography>
      )}

      {isContentPresent && (
        <Typography
          {...ContentTextProps}
          style={styles.content(
            isImagePresent,
            isHeadingPresent,
            isButtonPresent,
            $contentStyleOverride as StyleProp<ViewStyle>,
            ContentTextProps,
          )}
        >
          {content}
        </Typography>
      )}

      {isButtonPresent && (
        <Button onPress={buttonOnPress} {...ButtonProps}>
          {button}
        </Button>
      )}
    </SafeAreaView>
  );
}

const styleSheet = createStyleSheet(theme => ({
  container: (containerStyleOverride: StyleProp<ViewStyle>) => ({
    ...(containerStyleOverride as object),
  }),
  heading: (
    headingStyleOverride: StyleProp<TextStyle>,
    isImagePresent: boolean,
    isContentPresent: boolean,
    isButtonPresent: boolean,
    HeadingTextProps?: TextProps,
  ) => ({
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    ...(isImagePresent && { marginTop: theme.spacing.sm }),
    ...((isContentPresent || isButtonPresent) && {
      marginBottom: theme.spacing.sm,
    }),
    headingStyleOverride,
    ...(HeadingTextProps &&
      HeadingTextProps.style && {
        ...(HeadingTextProps.style as object),
      }),
  }),
  content: (
    isImagePresent: boolean,
    isHeadingPresent: boolean,
    isButtonPresent: boolean,
    contentStyleOverride: StyleProp<ViewStyle>,
    ContentTextProps?: TextProps,
  ) => ({
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...((isImagePresent || isHeadingPresent) && {
      marginTop: theme.spacing.sm,
    }),
    ...(isButtonPresent && {
      marginBottom: theme.spacing.sm,
    }),
    ...(contentStyleOverride as object),
    ...(ContentTextProps?.style && {
      ...(ContentTextProps.style as object),
    }),
  }),
}));
