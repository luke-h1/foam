import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { getPreferences } from '@app/store/preferenceStore';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/parsedPart';
import { isLowEndDevice } from '@app/utils/device/deviceTier';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import {
  isSevenTvEmoteSite,
  resolveEmotePreferredScale,
} from '@app/utils/emote/resolveEmoteScale';
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
    const { height, width } = calculateAspectRatio(
      part.width || 20,
      part.height || 20,
      targetSize,
    );
    // 2x is plenty for ~30pt inline emotes; 4x animated AVIFs cost ~4x the
    // decode CPU and frame memory (see issue #594 profiling). 1x on low-RAM
    // devices, and on 7TV emotes when the experimental low-res flag is on. The
    // flag is read non-reactively; toggling it bumps chatAssetPreferenceKey,
    // which reprocesses messages and re-renders these rows.
    const displayUrl = getDisplayEmoteUrl({
      image_variants: part.image_variants,
      url: part.url,
      static_url: part.static_url,
      disableAnimations,
      preferredScale: resolveEmotePreferredScale({
        isSevenTv: isSevenTvEmoteSite(part.site),
        sevenTvLowRes: getPreferences().sevenTvLowResEmotes,
        isLowEnd: isLowEndDevice(),
      }),
    });
    // No Pressable: long-press is detected by the row's timer, this just
    // records which emote the touch started on. A busy screen renders
    // hundreds of emotes, so each Pressable's gesture machinery added up.
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
        {/* No containerStyle: the size + clip live on the image style so each
            inline emote is one fewer Fabric/Yoga node. A busy message has many
            emotes, so this trims hundreds of views per screen on scroll. */}
        <ChatInlineImage
          sourceUrl={displayUrl}
          style={getEmoteImageStyle(width, height)}
          priority='normal'
          transitionMs={0}
        />
      </View>
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
