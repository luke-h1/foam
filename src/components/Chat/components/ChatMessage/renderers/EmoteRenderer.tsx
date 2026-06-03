import { Text } from '@app/components/ui/Text/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { memo, useMemo } from 'react';

import { ChatMessagePressable } from '../ChatMessagePressable';
import { ChatInlineImage } from './ChatInlineImage';

type PartVariant = ParsedPart<'emote'>;

interface EmoteRendererProps {
  disableAnimations?: boolean;
  part: PartVariant;
  handleEmoteLongPress?: (part: PartVariant) => void;
  shouldOverlayPrevious?: boolean;
  targetSize?: number;
}

export const EmoteRenderer = memo(
  ({
    part,
    handleEmoteLongPress,
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
        <ChatMessagePressable
          onLongPress={() => handleEmoteLongPress?.(part)}
          style={getButtonStyle(width, shouldOverlayPrevious)}
        >
          <Text style={getNameStyle(width, height)}>{part.name || '?'}</Text>
        </ChatMessagePressable>
      );
    }

    return (
      <ChatMessagePressable
        onLongPress={() => handleEmoteLongPress?.(part)}
        style={getButtonStyle(width, shouldOverlayPrevious)}
      >
        <ChatInlineImage
          cacheVariant='emote'
          containerStyle={getEmoteContainerStyle(width, height)}
          sourceUrl={displayUrl}
          style={{
            width,
            height,
          }}
        />
      </ChatMessagePressable>
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
