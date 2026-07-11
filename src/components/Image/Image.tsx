import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Image as ExpoImage,
  type ImageErrorEventData,
  type ImageLoadEventData,
} from 'expo-image';

import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';
import { logger } from '@app/utils/logger';

import type { ImageProps } from './Image.types';

function getSourceUrl(source: ImageProps['source']): string | null {
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'object' && 'uri' in source) {
    return source.uri;
  }
  return null;
}

function getHostname(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
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
  trackLoadContext,
  onError,
  onLoadEnd,
  onLoadStart,
  style,
  ...props
}: ImageProps) {
  const url = getSourceUrl(source);
  /**
   * Once the remote source has rendered, swapping to the freshly downloaded
   * file:// URI would make the native view fetch/decode the same bytes a
   * second time and replay the fade transition - the disk copy serves the
   * NEXT mount instead (getCachedImageUri resolves it synchronously then).
   */
  const loadedRemoteUrlRef = useRef<string | null>(null);
  const shouldUseFileCache = cacheToFile && process.env.NODE_ENV !== 'test';
  const diskCachedUrl =
    url && shouldUseFileCache
      ? getCachedImageUri(url, { variant: cacheVariant })
      : null;
  const [downloadedCache, setDownloadedCache] = useState<{
    sourceUrl: string | null;
    cachedUrl: string | null;
  }>({ sourceUrl: null, cachedUrl: null });
  const downloadedCachedUrl =
    downloadedCache.sourceUrl === url ? downloadedCache.cachedUrl : null;

  const fileCachedUrl = diskCachedUrl ?? downloadedCachedUrl;
  const resolvedUrl = fileCachedUrl ?? url;
  const resolvedSource =
    fileCachedUrl && typeof source === 'object' && 'uri' in source
      ? { ...source, uri: fileCachedUrl }
      : fileCachedUrl && typeof source === 'string'
        ? fileCachedUrl
        : source;
  useEffect(() => {
    if (!url || !shouldUseFileCache || diskCachedUrl) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    void cacheImageFromUrl(url, {
      priority: cachePriority,
      signal: controller.signal,
      variant: cacheVariant,
    }).then(cachedUrl => {
      if (
        !cancelled &&
        cachedUrl !== url &&
        loadedRemoteUrlRef.current !== url
      ) {
        setDownloadedCache({ sourceUrl: url, cachedUrl });
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cachePriority, cacheVariant, diskCachedUrl, shouldUseFileCache, url]);

  /**
   * When the wrapper's own file cache is handling persistence, keep
   * expo-image to memory caching - otherwise the same bytes land on disk
   * twice (expo-image's disk cache for the remote fetch plus our MMKV-
   * manifested file cache), burning through both caches' eviction budgets.
   */
  const resolvedCachePolicy =
    cachePolicy ?? (shouldUseFileCache ? 'memory' : undefined);

  const handleLoad = (event: ImageLoadEventData) => {
    if (!fileCachedUrl) {
      loadedRemoteUrlRef.current = url;
    }
    props.onLoad?.(event);
  };

  const handleError = (event: ImageErrorEventData) => {
    const host = getHostname(resolvedUrl);
    logger.main.warn('image.load_failed', {
      name: 'data_loading_warning',
      error: event?.error,
      url: typeof source === 'string' ? source : 'uri-object',
      urlHost: host ?? 'unknown',
      host,
      fromFileCache: Boolean(fileCachedUrl),
      imageRenderer: 'Image',
      imageContext: trackLoadContext ?? 'chat-image',
      tags: {
        image_renderer: 'Image',
        image_context: trackLoadContext ?? 'chat-image',
        image_host: host ?? 'unknown',
      },
    });
    onError?.(event);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={resolvedSource}
        style={style}
        contentFit={contentFit}
        cachePolicy={resolvedCachePolicy}
        transition={transition}
        decodeFormat='rgb'
        /**
         * Keyed on the ORIGINAL url: keying on the resolved url flipped the
         * recycling identity when the disk-cache swap landed, forcing a
         * needless teardown of the native image.
         */
        recyclingKey={recyclingKey ?? url ?? undefined}
        useAppleWebpCodec
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
