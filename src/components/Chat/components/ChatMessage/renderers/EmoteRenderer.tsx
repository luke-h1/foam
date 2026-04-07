import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  getCompressedEmoteUrl,
  compressEmoteUrl,
} from '@app/utils/image/emoteCompression';
import { memo, useEffect, useState, useMemo } from 'react';

import { EmoteActionSheet } from './EmoteActionSheet';

type PartVariant = ParsedPart<'emote'>;

interface EmoteRendererProps {
  part: PartVariant;
  handleEmotePress: (part: PartVariant) => void;
}

export const EmoteRenderer = memo(
  ({ part, handleEmotePress }: EmoteRendererProps) => {
    const { height, width } = useMemo(
      () => calculateAspectRatio(part.width || 20, part.height || 20, 30),
      [part.width, part.height],
    );

    const [compressedUrl, setCompressedUrl] = useState<string | null>(() => {
      // Initialize with cached value if available
      if (!part.url || part.url.startsWith('data:')) return null;
      const cached = getCompressedEmoteUrl(part.url);
      return cached && cached !== part.url ? cached : null;
    });

    useEffect(() => {
      // Reset if URL is cleared
      if (!part.url) {
        setCompressedUrl(null);
        return;
      }

      // If already compressed (data URI), no need to compress again
      if (part.url.startsWith('data:')) {
        setCompressedUrl(null);
        return;
      }

      // Check if already compressed in cache
      const cached = getCompressedEmoteUrl(part.url);
      if (cached && cached !== part.url) {
        setCompressedUrl(cached);
        return;
      }

      // Already have the right value, don't update
      if (compressedUrl === null) {
        // Start compression in background only if not cached
        void compressEmoteUrl(part.url).then(compressed => {
          // Update to compressed version when ready
          if (compressed && compressed !== part.url) {
            setCompressedUrl(compressed);
          }
        });
      }
    }, [part.url, compressedUrl]);

    // Use compressed URL if available, otherwise use original URL
    const imageUrl = compressedUrl || part.url || '';

    // Add error handling for missing URLs
    if (!part.url) {
      return (
        <EmoteActionSheet part={part} onPress={handleEmotePress}>
          <Button>
            <Text style={getNameStyle(width, height)}>{part.name || '?'}</Text>
          </Button>
        </EmoteActionSheet>
      );
    }

    return (
      <EmoteActionSheet part={part} onPress={handleEmotePress}>
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
