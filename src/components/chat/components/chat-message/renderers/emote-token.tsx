import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { useCachedEmoteAspectRatio } from '@app/providers/cached-emotes-provider/use-cached-emote';
import { calculateAspectRatio } from '@app/utils/chat/calculate-aspect-ratio';
import { MessageToken } from '@app/utils/chat/message-token';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolve-emote-display-url';
import { logger } from '@app/utils/logger';

import { ChatInlineImage } from './chat-inline-image';

interface EmoteTokenProps {
  disableAnimations?: boolean;
  isModerated?: boolean;
  token: MessageToken<'emote'>;
  onEmoteTouchStart?: (token: MessageToken<'emote'>) => void;
  shouldOverlayPrevious?: boolean;
  targetSize?: number;
}

export const EmoteToken = memo(
  ({
    token,
    onEmoteTouchStart,
    disableAnimations = false,
    isModerated = false,
    shouldOverlayPrevious = false,
    targetSize = 30,
  }: EmoteTokenProps) => {
    const displayUrl = resolveEmoteDisplayUrl(token, { disableAnimations });

    // Twitch, BTTV and some 7TV emotes arrive without size metadata, so the
    // box would default to 1:1 and letterbox non-square emotes. When metadata
    // is missing, size from the decoded emote's true aspect ratio.
    const measuredRatio = useCachedEmoteAspectRatio(
      token.width && token.height ? null : displayUrl,
    );

    const { height, width } =
      token.width && token.height
        ? calculateAspectRatio(token.width, token.height, targetSize)
        : calculateAspectRatio(measuredRatio ?? 1, 1, targetSize);

    // No Pressable: the row's timer detects long-press, this only records
    // which emote the touch started on. Hundreds of emotes per screen made
    // per-Pressable gesture machinery add up.
    const handleTouchStart = onEmoteTouchStart
      ? () => onEmoteTouchStart(token)
      : undefined;

    if (!displayUrl) {
      logger.chat.debug('chat.emote.no_url', {
        name: token.name,
        hasVariants: token.image_variants != null,
        url: token.url,
        site: token.site,
      });

      const fallbackLabel = token.content || token.name;

      return (
        <View
          onTouchStart={handleTouchStart}
          style={getContainerStyle(width, shouldOverlayPrevious, isModerated)}
        >
          {fallbackLabel ? (
            <ChatText style={getNameStyle(width, height)}>
              {fallbackLabel}
            </ChatText>
          ) : (
            <View
              style={getEmoteImageStyle(width, height)}
              testID='chat-emote-placeholder'
            />
          )}
        </View>
      );
    }

    const containerStyle = getContainerStyle(
      width,
      shouldOverlayPrevious,
      isModerated,
    );

    const needsWrapper = Boolean(containerStyle || token.overlaid?.length);

    // No containerStyle: size + clip live on the image style so each inline
    // emote is one fewer Fabric/Yoga node.
    const image = (
      <ChatInlineImage
        onTouchStart={needsWrapper ? undefined : handleTouchStart}
        sourceUrl={displayUrl}
        style={getEmoteImageStyle(width, height)}
        priority='normal'
        transitionMs={0}
      />
    );

    // The plain emote is the image alone: the wrapper only exists to carry an
    // overlay stack or an overlap margin, and most emotes have neither.
    if (!needsWrapper) {
      return image;
    }

    // Overlays sit above the base image, so the wrapper takes the touch and a
    // long press anywhere on the stack still finds this emote.
    return (
      <View style={containerStyle} onTouchStart={handleTouchStart}>
        {image}
        {token.overlaid?.map(overlay => (
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

interface OverlaidEmoteImageProps {
  baseHeight: number;
  baseWidth: number;
  disableAnimations: boolean;
  overlay: NonNullable<MessageToken<'emote'>['overlaid']>[number];
  targetSize: number;
}

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
}: OverlaidEmoteImageProps) {
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
