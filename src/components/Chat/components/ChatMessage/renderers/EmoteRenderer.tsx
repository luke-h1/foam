import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  getCompressedEmoteUrl,
  compressEmoteUrl,
} from '@app/utils/image/emoteCompression';
import { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native-unistyles';

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

    const onLongPress = useCallback(() => {
      handleEmotePress(part);
    }, [handleEmotePress, part]);

    // Add error handling for missing URLs
    if (!part.url) {
      return (
        <Button onLongPress={onLongPress}>
          <Text style={styles.name(width, height)}>{part.name || '?'}</Text>
        </Button>
      );
    }

    return (
      <Button onLongPress={onLongPress}>
        <Image
          source={{
            uri: imageUrl,
          }}
          containerStyle={styles.emoteContainer(width, height)}
          contentFit="contain"
          cachePolicy="memory-disk"
          decodeFormat="argb"
          useAppleWebpCodec
          transition={50}
          style={{
            width,
            height,
          }}
        />
      </Button>
    );
  },
);

EmoteRenderer.displayName = 'EmoteRenderer';

const styles = StyleSheet.create({
  emoteContainer: (width: number, height: number) => ({
    width,
    height,
    overflow: 'hidden' as const,
  }),
  name: (width: number, height: number) => ({
    width,
    height,
    textAlign: 'center',
  }),
});
