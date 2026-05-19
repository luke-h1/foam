/* eslint-disable no-restricted-imports */
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { sentryService } from '@app/lib/sentry';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { NitroImage } from 'react-native-nitro-image';
import { useMeasureImageLoadTime } from '@app/hooks/useMeasureImageLoadTime';
import {
  cacheImageFromUrl,
  getCachedImageUri,
  type ImageCachePriority,
} from '@app/utils/image/image-cache';
import { useCallback, useRef, useEffect, useState } from 'react';

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
  cachePriority?: ImageCachePriority;
  cacheToFile?: boolean;
  cacheVariant?: string;
  source?: string | { uri: string } | number;
}

/**
 * Extract URL from various source formats
 */
function getSourceUrl(source: ImageProps['source']): string | null {
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'object' && 'uri' in source) {
    return source.uri;
  }
  return null;
}

export const Image = function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 500,
  source,
  cachePolicy,
  cachePriority = 'visible',
  cacheToFile = true,
  cacheVariant = 'image',
  recyclingKey,
  useNitro = false,
  trackLoadTime = false,
  trackLoadContext,
  style,
  ...props
}: ImageProps) {
  const url = getSourceUrl(source);
  const [fileCachedUrl, setFileCachedUrl] = useState<string | null>(() =>
    url && cacheToFile
      ? getCachedImageUri(url, { variant: cacheVariant })
      : null,
  );
  const resolvedUrl = fileCachedUrl ?? url;
  const resolvedSource =
    fileCachedUrl && typeof source === 'object' && 'uri' in source
      ? { ...source, uri: fileCachedUrl }
      : fileCachedUrl && typeof source === 'string'
        ? fileCachedUrl
        : source;
  const imageRenderer = useNitro ? 'NitroImage' : 'Image';
  const trackLoad = Boolean(trackLoadTime && resolvedUrl);

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
        if (!resolvedUrl) {
          return undefined;
        }
        try {
          return new URL(resolvedUrl).hostname;
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
    [imageRenderer, trackLoad, trackLoadContext, resolvedUrl, source],
  );

  const { onLoadStart, onLoadEnd } = useMeasureImageLoadTime(
    imageRenderer,
    reportImageLoadTime,
    { fallbackToMountStartOnLoadEnd: useNitro },
  );
  const didReportNitroLoad = useRef(false);

  useEffect(() => {
    didReportNitroLoad.current = false;
  }, [resolvedUrl]);

  useEffect(() => {
    if (!url || !cacheToFile) {
      setFileCachedUrl(null);
      return;
    }

    const cached = getCachedImageUri(url, { variant: cacheVariant });
    setFileCachedUrl(cached);

    if (cached) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    void cacheImageFromUrl(url, {
      priority: cachePriority,
      signal: controller.signal,
      variant: cacheVariant,
    }).then(cachedUrl => {
      if (!cancelled && cachedUrl !== url) {
        setFileCachedUrl(cachedUrl);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cachePriority, cacheToFile, cacheVariant, url]);

  const handleNitroLoadEnd = useCallback(() => {
    if (!useNitro || !trackLoad || didReportNitroLoad.current || !resolvedUrl) {
      return;
    }
    didReportNitroLoad.current = true;
    onLoadEnd();
  }, [onLoadEnd, resolvedUrl, trackLoad, useNitro]);

  if (useNitro && resolvedUrl) {
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
          image={{ url: resolvedUrl }}
          style={style as StyleProp<ViewStyle>}
          resizeMode={resizeMode}
          recyclingKey={resolvedUrl}
          testID={props.testID}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={resolvedSource}
        style={style}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transition}
        decodeFormat="rgb"
        recyclingKey={recyclingKey ?? resolvedUrl ?? undefined}
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
