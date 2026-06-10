import { memo } from 'react';
import { Text } from '@app/components/ui/Text/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { View } from 'react-native';
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
    const { height, width } = calculateAspectRatio(
      part.width || 20,
      part.height || 20,
      targetSize,
    );
    // 2x is plenty for ~30pt inline emotes; 4x animated AVIFs cost ~4x the
    // decode CPU and frame memory (see issue #594 profiling).
    const displayUrl = getDisplayEmoteUrl({
      image_variants: part.image_variants,
      url: part.url,
      static_url: part.static_url,
      disableAnimations,
      preferredScale: '2x',
    });

    if (!displayUrl) {
      const fallbackLabel = part.content || part.name;

      if (!fallbackLabel) {
        return (
          <ChatMessagePressable
            onLongPress={() => handleEmoteLongPress?.(part)}
            style={getButtonStyle(width, shouldOverlayPrevious)}
          >
            <View
              style={getEmoteImageStyle(width, height)}
              testID='chat-emote-placeholder'
            />
          </ChatMessagePressable>
        );
      }

      return (
        <ChatMessagePressable
          onLongPress={() => handleEmoteLongPress?.(part)}
          style={getButtonStyle(width, shouldOverlayPrevious)}
        >
          <Text style={getNameStyle(width, height)}>{fallbackLabel}</Text>
        </ChatMessagePressable>
      );
    }

    return (
      <ChatMessagePressable
        onLongPress={() => handleEmoteLongPress?.(part)}
        style={getButtonStyle(width, shouldOverlayPrevious)}
      >
        {/* No containerStyle: the size + clip live on the NitroImage style so
            each inline emote is one fewer Fabric/Yoga node. A busy message has
            many emotes, so this trims hundreds of views per screen on scroll. */}
        <ChatInlineImage
          cacheVariant='emote'
          sourceUrl={displayUrl}
          style={getEmoteImageStyle(width, height)}
        />
      </ChatMessagePressable>
    );
  },
);

function getEmoteImageStyle(width: number, height: number) {
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
