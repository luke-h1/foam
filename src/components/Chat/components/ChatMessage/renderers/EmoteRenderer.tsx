import { Button } from '@app/components/Button';
import { Image } from '@app/components/Image';
import { Text } from '@app/components/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  getCompressedEmoteUrl,
  compressEmoteUrl,
} from '@app/utils/image/emoteCompression';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native-unistyles';

type PartVariant = ParsedPart<'emote'>;

interface EmoteRendererProps {
  part: PartVariant;
  handleEmotePress: (part: PartVariant) => void;
}

export const EmoteRenderer = ({
  part,
  handleEmotePress,
}: EmoteRendererProps) => {
  const { height, width } = calculateAspectRatio(
    part.width || 20,
    part.height || 20,
    30,
  );

  // Use lazy compression - track compressed URL, default to original
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);

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

    // No cache - reset compressed URL and start compression in background
    setCompressedUrl(null);

    // Start compression in background
    void compressEmoteUrl(part.url).then(compressed => {
      // Update to compressed version when ready
      if (compressed && compressed !== part.url) {
        setCompressedUrl(compressed);
      }
    });
  }, [part.url]);

  // Use compressed URL if available, otherwise use original URL
  const imageUrl = compressedUrl || part.url || '';

  // Add error handling for missing URLs
  if (!part.url) {
    return (
      <Button onLongPress={() => handleEmotePress(part)}>
        <Text style={styles.name(width, height)}>{part.name || '?'}</Text>
      </Button>
    );
  }

  return (
    <Button onLongPress={() => handleEmotePress(part)}>
      <Image
        source={{
          uri: imageUrl,
        }}
        cachePolicy="memory-disk"
        decodeFormat="argb"
        useAppleWebpCodec
        transition={50}
        style={{
          width,
          height,
        }}
        onError={error => {
          console.warn('Failed to load emote image:', imageUrl, error);
        }}
      />
    </Button>
  );
};

const styles = StyleSheet.create({
  name: (width: number, height: number) => ({
    width,
    height,
    textAlign: 'center',
  }),
});
