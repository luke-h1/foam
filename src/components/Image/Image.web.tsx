/* eslint-disable no-restricted-imports */
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { sentryService } from '@app/lib/sentry';
import { useMeasureImageLoadTime } from '@app/hooks/useMeasureImageLoadTime';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const WEB_IMAGE_CACHE_NAME = 'foam-image-cache-v1';

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

const canUseCacheStorage = () =>
  typeof globalThis.caches !== 'undefined' &&
  typeof globalThis.fetch !== 'undefined' &&
  typeof globalThis.URL !== 'undefined';

const fetchCachedBlobUrl = async (uri: string) => {
  if (!isCacheableWebUri(uri) || !canUseCacheStorage()) {
    return;
  }

  const cache = await globalThis.caches.open(WEB_IMAGE_CACHE_NAME);
  let response = await cache.match(uri);

  if (!response) {
    const fetched = await globalThis.fetch(uri, { cache: 'force-cache' });

    if (!fetched.ok) {
      return;
    }

    await cache.put(uri, fetched.clone());
    response = fetched;
  }

  const blob = await response.blob();
  return globalThis.URL.createObjectURL(blob);
};

export const prefetchImage = async (source: string | string[]) => {
  const sources = Array.isArray(source) ? source : [source];

  const results = await Promise.all(
    sources.map(async uri => {
      if (!isCacheableWebUri(uri) || !canUseCacheStorage()) {
        return ExpoImage.prefetch(uri);
      }

      try {
        const cache = await globalThis.caches.open(WEB_IMAGE_CACHE_NAME);

        if (await cache.match(uri)) {
          return true;
        }

        const response = await globalThis.fetch(uri, { cache: 'force-cache' });

        if (!response.ok) {
          return ExpoImage.prefetch(uri);
        }

        await cache.put(uri, response.clone());
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
  source?: string | { uri: string } | number;
}

export const Image = function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 500,
  source,
  cachePolicy,
  useNitro: _useNitro,
  trackLoadTime = false,
  trackLoadContext,
  style,
  ...props
}: ImageProps) {
  const sourceUri = useMemo(() => getSourceUri(source), [source]);
  const trackLoad = Boolean(trackLoadTime && sourceUri);
  const objectUrlRef = useRef<string | undefined>(undefined);
  const [cachedSource, setCachedSource] = useState<ImageProps['source']>();
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
  );

  useEffect(() => {
    let isMounted = true;

    const revokeObjectUrl = () => {
      if (objectUrlRef.current) {
        globalThis.URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = undefined;
      }
    };

    revokeObjectUrl();
    setCachedSource(undefined);

    if (cachePolicy === 'none' || !isCacheableWebUri(sourceUri)) {
      return () => {
        isMounted = false;
      };
    }

    const cacheableSourceUri = sourceUri;

    fetchCachedBlobUrl(cacheableSourceUri)
      .then(objectUrl => {
        if (!objectUrl) {
          return;
        }

        if (!isMounted) {
          globalThis.URL.revokeObjectURL(objectUrl);
          return;
        }

        objectUrlRef.current = objectUrl;
        setCachedSource({ uri: objectUrl });
      })
      .catch(() => {
        if (isMounted) {
          setCachedSource(undefined);
        }
      });

    return () => {
      isMounted = false;
      revokeObjectUrl();
    };
  }, [cachePolicy, sourceUri]);

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
