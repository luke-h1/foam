import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Image as ExpoImage } from 'expo-image';

import { logger } from '@app/utils/logger';

import type { ImageProps } from './Image.types';
import { imageFileStore } from './imageFileStore';

const isUriString = (source: ImageProps['source']): source is string =>
  String(source) === source;

const getSourceUri = (source: ImageProps['source']) => {
  if (source instanceof Object) {
    return source.uri;
  }

  return isUriString(source) ? source : undefined;
};

const isCacheableWebUri = (uri: string | undefined): uri is string =>
  uri !== undefined && /^https?:\/\//i.test(uri);

export const Image = function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 500,
  source,
  cachePolicy,
  cacheToFile = true,
  cacheVariant = 'image',
  recyclingKey,
  trackLoadContext,
  style,
  ...props
}: ImageProps) {
  const sourceUri = getSourceUri(source);
  const shouldUseFileCache = cacheToFile && imageFileStore.enabled;
  const diskCachedSource =
    sourceUri &&
    shouldUseFileCache &&
    isCacheableWebUri(sourceUri) &&
    cachePolicy !== 'none'
      ? (() => {
          const cachedUri = imageFileStore.getCachedImageUri(sourceUri, {
            variant: cacheVariant,
          });
          return cachedUri ? { uri: cachedUri } : undefined;
        })()
      : undefined;
  const [downloadedCache, setDownloadedCache] = useState<{
    sourceUri: string | undefined;
    source: ImageProps['source'];
  }>({ sourceUri: undefined, source: undefined });
  const downloadedCachedSource =
    downloadedCache.sourceUri === sourceUri
      ? downloadedCache.source
      : undefined;

  const cachedSource = diskCachedSource ?? downloadedCachedSource;

  useEffect(() => {
    let isMounted = true;

    if (
      cachePolicy === 'none' ||
      !shouldUseFileCache ||
      !isCacheableWebUri(sourceUri) ||
      diskCachedSource
    ) {
      return () => {
        isMounted = false;
      };
    }

    const cacheableSourceUri = sourceUri;
    const controller = new AbortController();
    imageFileStore
      .cacheImageFromUrl(cacheableSourceUri, {
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

        setDownloadedCache({
          sourceUri: cacheableSourceUri,
          source: { uri: objectUrl },
        });
      })
      .catch(() => {
        if (isMounted) {
          setDownloadedCache({
            sourceUri: cacheableSourceUri,
            source: undefined,
          });
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    cachePolicy,
    cacheVariant,
    diskCachedSource,
    shouldUseFileCache,
    sourceUri,
  ]);

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={cachedSource ?? source}
        style={style}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transition}
        decodeFormat='rgb'
        recyclingKey={recyclingKey ?? sourceUri}
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onError={error => {
          logger.main.debug('Image loading error:', {
            error,
            imageContext: trackLoadContext ?? 'chat-image',
          });
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
