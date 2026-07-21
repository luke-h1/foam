import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { useCachedEmoteAspectRatio } from '@app/Providers/CachedEmotesProvider/useCachedEmote';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/parsedPart';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { CHAT_INLINE_EMOTE_SCALE } from '@app/utils/emote/resolveEmoteScale';
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
    const displayUrl = getDisplayEmoteUrl({
      image_variants: part.image_variants,
      url: part.url,
      static_url: part.static_url,
      disableAnimations,
      preferredScale: CHAT_INLINE_EMOTE_SCALE,
    });

    /**
     * Twitch and BTTV don't advertise emote dimensions, and some 7TV encodes
     * arrive without size metadata too, so the box would default to 1:1 and a
     * non-square emote renders letterboxed at the wrong width. When metadata is
     * missing, size from the decoded emote's true aspect ratio instead - it's
     * usually already known for warm channel emotes (no visible shift) and lands
     * via the subscription once the emote decodes otherwise.
     */
    const measuredRatio = useCachedEmoteAspectRatio(
      part.width && part.height ? null : displayUrl,
    );

    const { height, width } =
      part.width && part.height
        ? calculateAspectRatio(part.width, part.height, targetSize)
        : calculateAspectRatio(measuredRatio ?? 1, 1, targetSize);
    /**
     * No Pressable: long-press is detected by the row's timer, this just
     * records which emote the touch started on. A busy screen renders
     * hundreds of emotes, so each Pressable's gesture machinery added up.
     */
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
            style={getContainerStyle(
              width,
              height,
              shouldOverlayPrevious,
              isModerated,
            )}
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
          style={getContainerStyle(
            width,
            height,
            shouldOverlayPrevious,
            isModerated,
          )}
        >
          <Text style={getNameStyle(width, height)}>{fallbackLabel}</Text>
        </View>
      );
    }

    return (
      <View
        onTouchStart={handleTouchStart}
        style={getContainerStyle(
          width,
          height,
          shouldOverlayPrevious,
          isModerated,
        )}
      >
        {/* No containerStyle: the size + clip live on the image style so each
            inline emote is one fewer Fabric/Yoga node. A busy message has many
            emotes, so this trims hundreds of views per screen on scroll. */}
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
  const displayUrl = getDisplayEmoteUrl({
    image_variants: overlay.image_variants,
    url: overlay.url,
    static_url: overlay.static_url,
    disableAnimations,
    preferredScale: CHAT_INLINE_EMOTE_SCALE,
  });

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
  height: number,
  shouldOverlayPrevious: boolean,
  isModerated: boolean,
) {
  return {
    width,
    height,
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
