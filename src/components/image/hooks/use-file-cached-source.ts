import { useEffect, useRef, useState } from 'react';

import type { ImageProps } from '../image.types';
import { imageFileStore } from '../util/image-file-store';

type SourceDescriptor =
  | { kind: 'none' }
  | { kind: 'module' }
  | { kind: 'remote'; url: string }
  | { kind: 'uriObject'; url: string | undefined; source: { uri?: string } };

interface UseFileCachedSourceOptions {
  cacheToFile: boolean;
  cacheVariant: NonNullable<ImageProps['cacheVariant']>;
  descriptor: SourceDescriptor;
  source: ImageProps['source'];
}

/**
 * Resolves an image to its on-disk copy when we have one, and downloads it in
 * the background when we do not.
 *
 * Once the remote source has rendered, swapping to the `file://` URI would
 * re-decode and replay the fade, so a URL that already drew is left alone and
 * the disk copy serves the NEXT mount instead.
 */
export function useFileCachedSource({
  cacheToFile,
  cacheVariant,
  descriptor,
  source,
}: UseFileCachedSourceOptions) {
  const url =
    descriptor.kind === 'remote' || descriptor.kind === 'uriObject'
      ? descriptor.url
      : null;

  const loadedRemoteUrlRef = useRef<string | null>(null);
  const shouldUseFileCache = cacheToFile && imageFileStore.enabled;

  const diskCachedUrl =
    url && shouldUseFileCache
      ? imageFileStore.getCachedImageUri(url, { variant: cacheVariant })
      : null;

  const [downloadedCache, setDownloadedCache] = useState<{
    sourceUrl: string | null;
    cachedUrl: string | null;
  }>({ sourceUrl: null, cachedUrl: null });

  const downloadedCachedUrl =
    downloadedCache.sourceUrl === url ? downloadedCache.cachedUrl : null;

  const fileCachedUrl = diskCachedUrl ?? downloadedCachedUrl;

  useEffect(() => {
    if (!url || !shouldUseFileCache || diskCachedUrl) {
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    void imageFileStore
      .cacheImageFromUrl(url, {
        signal: controller.signal,
        variant: cacheVariant,
      })
      .then(cachedUrl => {
        const isStale =
          cancelled || cachedUrl === url || loadedRemoteUrlRef.current === url;

        if (!isStale) {
          setDownloadedCache({ sourceUrl: url, cachedUrl });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cacheVariant, diskCachedUrl, shouldUseFileCache, url]);

  return {
    fileCachedUrl,
    loadedRemoteUrlRef,
    resolvedSource: resolveSource(descriptor, fileCachedUrl, source),
    resolvedUrl: fileCachedUrl ?? url,
    shouldUseFileCache,
    url,
  };
}

function resolveSource(
  descriptor: SourceDescriptor,
  fileCachedUrl: string | null,
  source: ImageProps['source'],
): ImageProps['source'] {
  if (!fileCachedUrl) {
    return source;
  }

  if (descriptor.kind === 'uriObject') {
    return { ...descriptor.source, uri: fileCachedUrl };
  }

  return descriptor.kind === 'remote' ? fileCachedUrl : source;
}
