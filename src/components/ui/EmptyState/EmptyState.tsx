/* eslint-disable no-restricted-imports */
import {
  type ImageStyle,
  Platform,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentUnavailableView, Host } from '@expo/ui/swift-ui';

import {
  EmptyLayout,
  EmptyLayoutButton,
  EmptyLayoutContent,
  EmptyLayoutDescription,
  EmptyLayoutHeader,
  EmptyLayoutMedia,
  EmptyLayoutTitle,
} from '@app/components/EmptyLayout/EmptyLayout';
import { Image } from '@app/components/Image/Image';
import type { ImageProps as AppImageProps } from '@app/components/Image/Image.types';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { theme } from '@app/styles/themes';

/**
 * ContentUnavailableView is iOS 17+; its native body is empty on iOS 16, so
 * earlier versions keep the JS layout.
 */
const supportsContentUnavailableView =
  Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 17;

function isStringValue(
  value: TextProps['children'] | SymbolViewProps['name'],
): value is string {
  return Object.prototype.toString.call(value) === '[object String]';
}

interface EmptyStatePresetItem {
  iconName: SymbolViewProps['name'];
  heading: string;
  content: string;
  button: string;
}

const EMPTY_STATE_PRESETS = {
  generic: {
    iconName: 'tv',
    heading: 'Nothing here yet',
    content: 'Refresh to try again, or come back in a moment.',
    button: 'Refresh',
  },
} satisfies Record<string, EmptyStatePresetItem>;

interface EmptyStateProps {
  preset?: keyof typeof EMPTY_STATE_PRESETS;
  style?: StyleProp<ViewStyle>;
  imageSource?: AppImageProps['source'];
  imageStyle?: StyleProp<ImageStyle>;
  imageProps?: Omit<AppImageProps, 'source'>;
  heading?: TextProps['children'];
  headingStyle?: StyleProp<TextStyle>;
  headingTextProps?: TextProps;
  content?: TextProps['children'];
  contentStyle?: StyleProp<TextStyle>;
  contentTextProps?: TextProps;
  button?: string | null;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonOnPress?: () => void;
  iconName?: SymbolViewProps['name'];
  iconSize?: number;
  iconTintColor?: string;
}

export function EmptyState({
  preset = 'generic',
  style,
  imageSource,
  imageStyle,
  imageProps,
  heading,
  headingStyle,
  headingTextProps,
  content,
  contentStyle,
  contentTextProps,
  button,
  buttonStyle,
  buttonOnPress,
  iconName,
  iconSize = 56,
  iconTintColor = theme.color.textSecondary.dark,
}: EmptyStateProps) {
  const presetConfig = EMPTY_STATE_PRESETS[preset];
  const resolvedImageSource = imageSource;
  const resolvedIconName = resolvedImageSource
    ? undefined
    : (iconName ?? presetConfig.iconName);
  const resolvedHeading = heading ?? presetConfig.heading;
  const resolvedContent = content ?? presetConfig.content;
  const resolvedButton = button === undefined ? presetConfig.button : button;

  const iosSymbol = isStringValue(resolvedIconName)
    ? resolvedIconName
    : resolvedIconName?.ios;
  const headingText = isStringValue(resolvedHeading)
    ? resolvedHeading
    : undefined;
  const contentText = isStringValue(resolvedContent)
    ? resolvedContent
    : undefined;

  if (
    supportsContentUnavailableView &&
    !resolvedImageSource &&
    headingText !== undefined &&
    contentText !== undefined
  ) {
    return (
      <SafeAreaView style={[styles.container, style]}>
        <Host style={styles.iosHost}>
          <ContentUnavailableView
            title={headingText}
            systemImage={iosSymbol}
            description={contentText}
          />
        </Host>
        {resolvedButton ? (
          <EmptyLayoutButton
            title={resolvedButton}
            onPress={buttonOnPress}
            style={[styles.buttonWrap, styles.iosButtonWrap, buttonStyle]}
            variant='default'
          />
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]}>
      <EmptyLayout style={styles.emptyLayout}>
        <EmptyLayoutHeader>
          {resolvedIconName ? (
            <EmptyLayoutMedia style={styles.iconWrap}>
              <SymbolView
                name={resolvedIconName}
                size={iconSize}
                tintColor={iconTintColor}
              />
            </EmptyLayoutMedia>
          ) : null}

          {resolvedImageSource ? (
            <EmptyLayoutContent style={styles.mediaWrap}>
              <Image
                {...imageProps}
                source={resolvedImageSource}
                style={[styles.image, imageStyle]}
              />
            </EmptyLayoutContent>
          ) : null}

          {resolvedHeading ? (
            <EmptyLayoutTitle
              {...headingTextProps}
              style={[
                styles.heading,
                resolvedImageSource ? styles.headingWithImage : null,
                resolvedContent || resolvedButton
                  ? styles.headingWithBody
                  : null,
                headingTextProps?.style,
                headingStyle,
              ]}
            >
              {resolvedHeading}
            </EmptyLayoutTitle>
          ) : null}

          {resolvedContent ? (
            <EmptyLayoutDescription
              {...contentTextProps}
              style={[
                styles.content,
                resolvedImageSource || resolvedHeading
                  ? styles.contentWithHeader
                  : null,
                resolvedButton ? styles.contentWithButton : null,
                contentTextProps?.style,
                contentStyle,
              ]}
            >
              {resolvedContent}
            </EmptyLayoutDescription>
          ) : null}
        </EmptyLayoutHeader>

        {resolvedButton ? (
          <EmptyLayoutButton
            title={resolvedButton}
            onPress={buttonOnPress}
            style={[styles.buttonWrap, buttonStyle]}
            variant='default'
          />
        ) : null}
      </EmptyLayout>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: theme.space20,
    textAlign: 'center',
  },
  contentWithButton: {
    marginBottom: theme.space12,
  },
  contentWithHeader: {
    marginTop: theme.space12,
  },
  emptyLayout: {
    maxWidth: 420,
    minHeight: 360,
    width: '100%',
  },
  buttonWrap: {
    alignSelf: 'center',
    minWidth: 160,
  },
  heading: {
    paddingHorizontal: theme.space20,
    textAlign: 'center',
  },
  headingWithBody: {
    marginBottom: theme.space12,
  },
  headingWithImage: {
    marginTop: theme.space12,
  },
  iconWrap: {
    marginBottom: theme.space20,
  },
  iosButtonWrap: {
    marginBottom: theme.space44,
  },
  iosHost: {
    alignSelf: 'stretch',
    flex: 1,
  },
  image: {
    borderRadius: theme.borderRadius20,
    height: 112,
    width: 112,
  },
  mediaWrap: {
    marginBottom: theme.space20,
  },
} satisfies Record<string, ViewStyle | TextStyle>;
