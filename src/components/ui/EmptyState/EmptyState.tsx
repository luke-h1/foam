/* eslint-disable no-restricted-imports */
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
import { theme } from '@app/styles/themes';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type {
  ImageStyle,
  StyleProp,
  TextProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
interface EmptyStatePresetItem {
  iconName: SymbolViewProps['name'];
  headingKey: 'nothingHereYet';
  contentKey: 'nothingHereYetDescription';
  buttonKey: 'refresh';
}

const EMPTY_STATE_PRESETS = {
  generic: {
    iconName: 'tv',
    headingKey: 'nothingHereYet',
    contentKey: 'nothingHereYetDescription',
    buttonKey: 'refresh',
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
  const { t } = useTranslation('common');
  const presetConfig = EMPTY_STATE_PRESETS[preset];
  const resolvedImageSource = imageSource;
  const resolvedIconName = resolvedImageSource
    ? undefined
    : (iconName ?? presetConfig.iconName);
  const resolvedHeading = heading ?? t(presetConfig.headingKey);
  const resolvedContent = content ?? t(presetConfig.contentKey);
  const resolvedButton =
    button === undefined ? t(presetConfig.buttonKey) : button;

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
  image: {
    borderRadius: theme.borderRadius20,
    height: 112,
    width: 112,
  },
  mediaWrap: {
    marginBottom: theme.space20,
  },
} satisfies Record<string, ViewStyle | TextStyle>;
