import { Button } from '@app/components/Button';
import { Image } from '@app/components/Image';
import { Typography } from '@app/components/Typography';
import { calculateAspectRatio, ParsedPart } from '@app/utils';

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
  // Add error handling for missing URLs
  if (!part.url) {
    return (
      <Button onLongPress={() => handleEmotePress(part)}>
        <Typography style={{ width, height, textAlign: 'center' }}>
          {part.name || '?'}
        </Typography>
      </Button>
    );
  }

  return (
    <Button onLongPress={() => handleEmotePress(part)}>
      <Image
        source={part.url}
        cachePolicy="memory-disk"
        decodeFormat="rgb"
        useAppleWebpCodec
        transition={50}
        style={{
          width,
          height,
        }}
        onError={error => {
          console.warn('Failed to load emote image:', part.url, error);
        }}
      />
    </Button>
  );
};
