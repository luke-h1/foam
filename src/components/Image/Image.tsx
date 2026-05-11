/* eslint-disable no-restricted-imports */
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { sentryService } from '@app/lib/sentry';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { NitroImage } from 'react-native-nitro-image';
import { useMeasureImageLoadTime } from '@app/hooks/useMeasureImageLoadTime';
import { useCallback, useRef, useEffect } from 'react';

export const prefetchImage = (source: string | string[]) =>
  ExpoImage.prefetch(source);

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Use NitroImage for faster rendering (direct native bindings)
   * Best for chat emotes and high-volume image lists
   */
  useNitro?: boolean;
  /**
   * Track load timings and report to Sentry for observability
   */
  trackLoadTime?: boolean;
  /**
   * Label used for Sentry context when reporting image load timing
   */
  trackLoadContext?: string;
  source?: string | { uri: string } | number;
}

/**
 * Extract URL from various source formats
 */
function getSourceUrl(source: ImageProps['source']): string | null {
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && 'uri' in source) return source.uri;
  return null;
}

export const Image = function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 500,
  source,
  cachePolicy,
  useNitro = false,
  trackLoadTime = false,
  trackLoadContext,
  style,
  ...props
}: ImageProps) {
  const url = getSourceUrl(source);
  const imageRenderer = useNitro ? 'NitroImage' : 'Image';
  const trackLoad = Boolean(trackLoadTime && url);

  const reportImageLoadTime = useCallback(
    (timing: {
      mountTimestamp: number;
      loadStartTimestamp: number;
      loadEndTimestamp: number;
    }) => {
      if (!trackLoad) {
        return;
      }

      const totalLoadTimeMs = timing.loadEndTimestamp - timing.mountTimestamp;
      const startToLoadTimeMs =
        timing.loadEndTimestamp - timing.loadStartTimestamp;
      const safeHost = (() => {
        if (!url) {
          return undefined;
        }
        try {
          return new URL(url).hostname;
        } catch {
          return undefined;
        }
      })();

      sentryService.withScope(scope => {
        scope.setTag('perf.image.renderer', imageRenderer);
        scope.setTag('perf.image.context', trackLoadContext ?? 'chat-image');
        scope.setContext('perf.image.load', {
          urlHost: safeHost ?? 'unknown',
          url: typeof source === 'string' ? source : 'uri-object',
          durationFromMountMs: Math.round(totalLoadTimeMs),
          durationFromLoadStartMs: Math.round(startToLoadTimeMs),
        });
        sentryService.captureMessage('chat.image.load_time', {
          imageLoadTimeMs: Math.round(totalLoadTimeMs),
          imageLoadStartTimeMs: Math.round(startToLoadTimeMs),
          imageRenderer,
          imageContext: trackLoadContext ?? 'chat-image',
          host: safeHost,
        });
      });
    },
    [imageRenderer, trackLoad, trackLoadContext, url, source],
  );

  const { onLoadStart, onLoadEnd } = useMeasureImageLoadTime(
    imageRenderer,
    reportImageLoadTime,
    { fallbackToMountStartOnLoadEnd: useNitro },
  );
  const didReportNitroLoad = useRef(false);

  useEffect(() => {
    didReportNitroLoad.current = false;
  }, [url]);

  const handleNitroLoadEnd = useCallback(() => {
    if (!useNitro || !trackLoad || didReportNitroLoad.current || !url) {
      return;
    }
    didReportNitroLoad.current = true;
    onLoadEnd();
  }, [onLoadEnd, trackLoad, url, useNitro]);

  if (useNitro && url) {
    const resizeMode = ((): 'cover' | 'contain' | 'stretch' => {
      if (contentFit === 'cover') {
        return 'cover';
      }
      if (contentFit === 'contain') {
        return 'contain';
      }
      if (contentFit === 'fill') {
        return 'stretch';
      }
      return 'cover';
    })();

    return (
      <View
        style={[styles.container, containerStyle]}
        onLayout={handleNitroLoadEnd}
      >
        <NitroImage
          image={{ url }}
          style={style as StyleProp<ViewStyle>}
          resizeMode={resizeMode}
          recyclingKey={url}
          testID={props.testID}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={source}
        style={style}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transition}
        decodeFormat="rgb"
        useAppleWebpCodec
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onError={error => {
          if (__DEV__) {
            console.warn('Image loading error:', error);
          }
        }}
        onLoadStart={trackLoad ? onLoadStart : undefined}
        onLoadEnd={trackLoad ? onLoadEnd : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
