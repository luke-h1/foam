/* eslint-disable no-restricted-imports */
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { sentryService } from '@app/lib/sentry';
import { useMeasureImageLoadTime } from '@app/hooks/useMeasureImageLoadTime';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  cacheImageFromUrl,
  getCachedImageUri,
  type ImageCachePriority,
} from '@app/utils/image/image-cache';

const getSourceUri = (source: ImageProps['source']) => {
  if (typeof source === 'string') {
    return source;
  }

  if (
    typeof source === 'object' &&
    source !== null &&
    'uri' in source &&
    typeof source.uri === 'string'
  ) {
    return source.uri;
  }

  return undefined;
};

const isCacheableWebUri = (uri: string | undefined): uri is string =>
  typeof uri === 'string' && /^https?:\/\//i.test(uri);

export const prefetchImage = async (source: string | string[]) => {
  const sources = Array.isArray(source) ? source : [source];

  const results = await Promise.all(
    sources.map(async uri => {
      try {
        await cacheImageFromUrl(uri, { priority: 'background' });
        return true;
      } catch {
        return ExpoImage.prefetch(uri);
      }
    }),
  );

  return results.every(Boolean);
};

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Native-only NitroImage fast path. Ignored on web.
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
  useNitro: _useNitro,
  trackLoadTime = false,
  trackLoadContext,
  style,
  ...props
}: ImageProps) {
  const sourceUri = useMemo(() => getSourceUri(source), [source]);
  const trackLoad = Boolean(trackLoadTime && sourceUri);
  const [cachedSource, setCachedSource] = useState<ImageProps['source']>(() => {
    if (!sourceUri || !cacheToFile) {
      return undefined;
    }

    const cachedUri = getCachedImageUri(sourceUri, { variant: cacheVariant });
    return cachedUri ? { uri: cachedUri } : undefined;
  });
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
        if (!sourceUri) {
          return 'unknown';
        }
        try {
          return new URL(sourceUri).hostname;
        } catch {
          return 'unknown';
        }
      })();

      sentryService.withScope(scope => {
        scope.setTag('perf.image.renderer', 'Image');
        scope.setTag('perf.image.context', trackLoadContext ?? 'chat-image');
        scope.setContext('perf.image.load', {
          urlHost: safeHost,
          url: sourceUri ?? 'unknown',
          durationFromMountMs: Math.round(totalLoadTimeMs),
          durationFromLoadStartMs: Math.round(startToLoadTimeMs),
          platform: 'web',
        });
        sentryService.captureMessage('chat.image.load_time', {
          imageLoadTimeMs: Math.round(totalLoadTimeMs),
          imageLoadStartTimeMs: Math.round(startToLoadTimeMs),
          imageRenderer: 'Image',
          imageContext: trackLoadContext ?? 'chat-image',
          host: safeHost,
          platform: 'web',
        });
      });
    },
    [sourceUri, trackLoad, trackLoadContext],
  );
  const { onLoadStart, onLoadEnd } = useMeasureImageLoadTime(
    'Image',
    reportImageLoadTime,
    { fallbackToMountStartOnLoadEnd: true },
  );

  useEffect(() => {
    let isMounted = true;
    setCachedSource(undefined);

    if (
      cachePolicy === 'none' ||
      !cacheToFile ||
      !isCacheableWebUri(sourceUri)
    ) {
      return () => {
        isMounted = false;
      };
    }

    const cacheableSourceUri = sourceUri;
    const existingCachedUri = getCachedImageUri(cacheableSourceUri, {
      variant: cacheVariant,
    });
    if (existingCachedUri) {
      setCachedSource({ uri: existingCachedUri });
      return () => {
        isMounted = false;
      };
    }

    const controller = new AbortController();
    cacheImageFromUrl(cacheableSourceUri, {
      priority: cachePriority,
      signal: controller.signal,
      variant: cacheVariant,
    })
      .then(objectUrl => {
        if (!objectUrl || objectUrl === cacheableSourceUri) {
          return;
        }

        if (!isMounted) {
          globalThis.URL.revokeObjectURL(objectUrl);
          return;
        }

        setCachedSource({ uri: objectUrl });
      })
      .catch(() => {
        if (isMounted) {
          setCachedSource(undefined);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [cachePolicy, cachePriority, cacheToFile, cacheVariant, sourceUri]);

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={cachedSource ?? source}
        style={style}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transition}
        decodeFormat="rgb"
        recyclingKey={recyclingKey ?? sourceUri}
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onLoadStart={trackLoad ? onLoadStart : undefined}
        onLoadEnd={trackLoad ? onLoadEnd : undefined}
        onError={error => {
          if (__DEV__) {
            console.warn('Image loading error:', error);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
