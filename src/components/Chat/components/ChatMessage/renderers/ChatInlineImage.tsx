import { memo, useEffect, useState } from 'react';
import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';
import {
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { NitroImage } from 'react-native-nitro-image';

interface ChatInlineImageProps {
  cacheVariant: 'badge' | 'emote';
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  sourceUrl: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
}

function ChatInlineImageComponent({
  cacheVariant,
  containerStyle,
  resizeMode = 'contain',
  sourceUrl,
  style,
  testID,
}: ChatInlineImageProps) {
  const diskCachedUrl =
    getCachedImageUri(sourceUrl, { variant: cacheVariant }) ?? null;
  const [downloadedCache, setDownloadedCache] = useState<{
    cachedUrl: string | null;
    sourceUrl: string | null;
  }>({ cachedUrl: null, sourceUrl: null });
  const downloadedCachedUrl =
    downloadedCache.sourceUrl === sourceUrl ? downloadedCache.cachedUrl : null;
  const resolvedUrl = diskCachedUrl ?? downloadedCachedUrl ?? sourceUrl;
  const image = { url: resolvedUrl };

  useEffect(() => {
    if (!sourceUrl || diskCachedUrl || process.env.NODE_ENV === 'test') {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void cacheImageFromUrl(sourceUrl, {
      priority: 'visible',
      signal: controller.signal,
      variant: cacheVariant,
    }).then(cachedUrl => {
      if (!cancelled && cachedUrl !== sourceUrl) {
        setDownloadedCache({ sourceUrl, cachedUrl });
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cacheVariant, diskCachedUrl, sourceUrl]);

  const imageElement = (
    <NitroImage
      image={image}
      resizeMode={resizeMode}
      recyclingKey={resolvedUrl}
      style={style}
      testID={testID}
    />
  );

  if (!containerStyle) {
    return imageElement;
  }

  return <View style={containerStyle}>{imageElement}</View>;
}

export const ChatInlineImage = memo(ChatInlineImageComponent);
