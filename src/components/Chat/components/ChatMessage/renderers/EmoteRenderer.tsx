import { Button } from '@app/components/Button';
import { Image } from '@app/components/Image';
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
  return (
    <Button onLongPress={() => handleEmotePress(part)}>
      <Image
        source={part.url ?? ''}
        transition={50}
        style={{
          width,
          height,
        }}
      />
    </Button>
  );
};
