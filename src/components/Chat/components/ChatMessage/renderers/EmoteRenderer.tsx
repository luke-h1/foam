import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { memo, useMemo } from 'react';

import { EmoteActionSheet } from './EmoteActionSheet';

type PartVariant = ParsedPart<'emote'>;

interface EmoteRendererProps {
  disableAnimations?: boolean;
  part: PartVariant;
  handleEmotePress: (part: PartVariant) => void;
  shouldOverlayPrevious?: boolean;
  targetSize?: number;
}

export const EmoteRenderer = memo(
  ({
    part,
    handleEmotePress,
    disableAnimations = false,
    shouldOverlayPrevious = false,
    targetSize = 30,
  }: EmoteRendererProps) => {
    const { height, width } = useMemo(
      () =>
        calculateAspectRatio(part.width || 20, part.height || 20, targetSize),
      [part.width, part.height, targetSize],
    );
    const displayUrl = useMemo(
      () =>
        getDisplayEmoteUrl({
          image_variants: part.image_variants,
          url: part.url,
          static_url: part.static_url,
          disableAnimations,
        }),
      [disableAnimations, part.image_variants, part.static_url, part.url],
    );

    if (!displayUrl) {
      return (
        <EmoteActionSheet
          disableAnimations={disableAnimations}
          part={part}
          onPress={handleEmotePress}
        >
          <Button style={getButtonStyle(width, shouldOverlayPrevious)}>
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
        <Button style={getButtonStyle(width, shouldOverlayPrevious)}>
          <Image
            useNitro
            source={{
              uri: displayUrl,
            }}
            containerStyle={getEmoteContainerStyle(width, height)}
            contentFit='contain'
            cachePolicy='memory-disk'
            cachePriority='visible'
            cacheVariant='emote'
            decodeFormat='argb'
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

function getButtonStyle(width: number, shouldOverlayPrevious: boolean) {
  if (!shouldOverlayPrevious) {
    return undefined;
  }

  return {
    marginLeft: Math.round(width * -0.72),
    zIndex: 2,
  };
}

function getNameStyle(width: number, height: number) {
  return {
    width,
    height,
    textAlign: 'center' as const,
  };
}
