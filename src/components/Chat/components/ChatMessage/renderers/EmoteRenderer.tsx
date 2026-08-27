import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { useCachedEmoteAspectRatio } from '@app/Providers/CachedEmotesProvider/useCachedEmote';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/parsedPart';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolveEmoteDisplayUrl';
import { logger } from '@app/utils/logger';

import { ChatInlineImage } from './ChatInlineImage';

type PartVariant = ParsedPart<'emote'>;

interface EmoteRendererProps {
  disableAnimations?: boolean;
  isModerated?: boolean;
  part: PartVariant;
  onEmoteTouchStart?: (part: PartVariant) => void;
  shouldOverlayPrevious?: boolean;
  targetSize?: number;
}

export const EmoteRenderer = memo(
  ({
    part,
    onEmoteTouchStart,
    disableAnimations = false,
    isModerated = false,
    shouldOverlayPrevious = false,
    targetSize = 30,
  }: EmoteRendererProps) => {
    const displayUrl = resolveEmoteDisplayUrl(part, { disableAnimations });

    // Twitch, BTTV and some 7TV emotes arrive without size metadata, so the
    // box would default to 1:1 and letterbox non-square emotes. When metadata
    // is missing, size from the decoded emote's true aspect ratio.
    const measuredRatio = useCachedEmoteAspectRatio(
      part.width && part.height ? null : displayUrl,
    );

    const { height, width } =
      part.width && part.height
        ? calculateAspectRatio(part.width, part.height, targetSize)
        : calculateAspectRatio(measuredRatio ?? 1, 1, targetSize);
    // No Pressable: the row's timer detects long-press, this only records
    // which emote the touch started on. Hundreds of emotes per screen made
    // per-Pressable gesture machinery add up.
    const handleTouchStart = onEmoteTouchStart
      ? () => onEmoteTouchStart(part)
      : undefined;

    if (!displayUrl) {
      logger.chat.debug('chat.emote.no_url', {
        name: part.name,
        hasVariants: part.image_variants != null,
        url: part.url,
        site: part.site,
      });
      const fallbackLabel = part.content || part.name;

      if (!fallbackLabel) {
        return (
          <View
            onTouchStart={handleTouchStart}
            style={getContainerStyle(width, shouldOverlayPrevious, isModerated)}
          >
            <View
              style={getEmoteImageStyle(width, height)}
              testID='chat-emote-placeholder'
            />
          </View>
        );
      }

      return (
        <View
          onTouchStart={handleTouchStart}
          style={getContainerStyle(width, shouldOverlayPrevious, isModerated)}
        >
          <Text style={getNameStyle(width, height)}>{fallbackLabel}</Text>
        </View>
      );
    }

    return (
      <View
        onTouchStart={handleTouchStart}
        style={getContainerStyle(width, shouldOverlayPrevious, isModerated)}
      >
        {/* No containerStyle: size + clip live on the image style so each
            inline emote is one fewer Fabric/Yoga node. */}
        <ChatInlineImage
          sourceUrl={displayUrl}
          style={getEmoteImageStyle(width, height)}
          priority='normal'
          transitionMs={0}
        />
        {part.overlaid?.map(overlay => (
          <OverlaidEmoteImage
            key={overlay.id ?? overlay.content}
            baseHeight={height}
            baseWidth={width}
            disableAnimations={disableAnimations}
            overlay={overlay}
            targetSize={targetSize}
          />
        ))}
      </View>
    );
  },
);

/**
 * A zero-width emote composited over its base emote, centered the way the
 * 7TV extension stacks overlays.
 */
function OverlaidEmoteImage({
  baseHeight,
  baseWidth,
  disableAnimations,
  overlay,
  targetSize,
}: {
  baseHeight: number;
  baseWidth: number;
  disableAnimations: boolean;
  overlay: NonNullable<PartVariant['overlaid']>[number];
  targetSize: number;
}) {
  const { height, width } = calculateAspectRatio(
    overlay.width || 20,
    overlay.height || 20,
    targetSize,
  );
  const displayUrl = resolveEmoteDisplayUrl(overlay, { disableAnimations });

  if (!displayUrl) {
    return null;
  }

  return (
    <ChatInlineImage
      sourceUrl={displayUrl}
      style={getOverlayEmoteStyle(baseWidth, baseHeight, width, height)}
      priority='normal'
      transitionMs={0}
    />
  );
}

function getOverlayEmoteStyle(
  baseWidth: number,
  baseHeight: number,
  width: number,
  height: number,
) {
  return {
    position: 'absolute' as const,
    left: Math.round((baseWidth - width) / 2),
    top: Math.round((baseHeight - height) / 2),
    width,
    height,
    zIndex: 2,
  };
}

function getEmoteImageStyle(width: number, height: number) {
  return {
    width,
    height,
    overflow: 'hidden' as const,
  };
}

function getContainerStyle(
  width: number,
  shouldOverlayPrevious: boolean,
  isModerated: boolean,
) {
  if (!shouldOverlayPrevious && !isModerated) {
    return undefined;
  }

  return {
    ...(shouldOverlayPrevious && {
      marginLeft: Math.round(width * -0.72),
      zIndex: 2,
    }),
    ...(isModerated && { opacity: 0.72 }),
  };
}

function getNameStyle(width: number, height: number) {
  return {
    width,
    height,
    textAlign: 'center' as const,
  };
}
