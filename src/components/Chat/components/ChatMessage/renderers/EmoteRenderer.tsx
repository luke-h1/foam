import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import {
  getCompressedEmoteUrl,
  compressEmoteUrl,
} from '@app/utils/image/emoteCompression';
import { memo, useEffect, useState, useMemo } from 'react';

import { EmoteActionSheet } from './EmoteActionSheet';

type PartVariant = ParsedPart<'emote'>;

interface EmoteRendererProps {
  disableAnimations?: boolean;
  part: PartVariant;
  handleEmotePress: (part: PartVariant) => void;
}

export const EmoteRenderer = memo(
  ({
    part,
    handleEmotePress,
    disableAnimations = false,
  }: EmoteRendererProps) => {
    const { height, width } = useMemo(
      () => calculateAspectRatio(part.width || 20, part.height || 20, 30),
      [part.width, part.height],
    );
    const displayUrl = useMemo(
      () =>
        getDisplayEmoteUrl({
          url: part.url,
          static_url: part.static_url,
          disableAnimations,
        }),
      [disableAnimations, part.static_url, part.url],
    );

    const [compressedUrl, setCompressedUrl] = useState<string | null>(() => {
      // Initialize with cached value if available
      if (!displayUrl || displayUrl.startsWith('data:')) return null;
      const cached = getCompressedEmoteUrl(displayUrl);
      return cached && cached !== displayUrl ? cached : null;
    });

    useEffect(() => {
      if (!displayUrl) {
        setCompressedUrl(null);
        return;
      }

      if (displayUrl.startsWith('data:')) {
        setCompressedUrl(null);
        return;
      }

      const cached = getCompressedEmoteUrl(displayUrl);
      setCompressedUrl(cached && cached !== displayUrl ? cached : null);
    }, [displayUrl]);

    useEffect(() => {
      if (!displayUrl || displayUrl.startsWith('data:') || compressedUrl) {
        return;
      }

      let cancelled = false;

      void compressEmoteUrl(displayUrl).then(compressed => {
        if (!cancelled && compressed && compressed !== displayUrl) {
          setCompressedUrl(compressed);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [compressedUrl, displayUrl]);

    // Use compressed URL if available, otherwise use original URL
    const imageUrl = compressedUrl || displayUrl;

    // Add error handling for missing URLs
    if (!displayUrl) {
      return (
        <EmoteActionSheet
          disableAnimations={disableAnimations}
          part={part}
          onPress={handleEmotePress}
        >
          <Button>
            <Text style={getNameStyle(width, height)}>{part.name || '?'}</Text>
          </Button>
        </EmoteActionSheet>
      );
    }

    return (
      <EmoteActionSheet
        disableAnimations={disableAnimations}
        part={part}
        onPress={handleEmotePress}
      >
        <Button>
          <Image
            useNitro
            source={{
              uri: imageUrl,
            }}
            containerStyle={getEmoteContainerStyle(width, height)}
            contentFit="contain"
            cachePolicy="memory-disk"
            decodeFormat="argb"
            useAppleWebpCodec
            transition={0}
            style={{
              width,
              height,
            }}
          />
        </Button>
      </EmoteActionSheet>
    );
  },
);

EmoteRenderer.displayName = 'EmoteRenderer';

function getEmoteContainerStyle(width: number, height: number) {
  return {
    width,
    height,
    overflow: 'hidden' as const,
  };
}

function getNameStyle(width: number, height: number) {
  return {
    width,
    height,
    textAlign: 'center' as const,
  };
}
