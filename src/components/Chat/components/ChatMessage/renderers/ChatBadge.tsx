import { memo, useState } from 'react';

import { Image as ExpoImage } from 'expo-image';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { ChatMessagePressable } from '../ChatMessagePressable';
import type { ChatFontScale } from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';

interface ChatBadgeProps {
  badge: SanitisedBadgeSet;
  compact: boolean;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  onPress?: (badge: SanitisedBadgeSet) => void;
}

/**
 * A badge is a handful of small, stable urls per channel, so it renders
 * straight off its url through expo-image's own memory+disk cache. It
 * deliberately does not go through the shared decoded-ImageRef cache the
 * emote path uses: that cache evicts under memory pressure and can drop a ref
 * out from under a mounted row, which for a badge reads as a permanent
 * transparent gap beside the username.
 *
 * A dead url collapses the whole slot - margin included - rather than the
 * artwork alone, so a badge we cannot draw leaves no hole in the row.
 */
function ChatBadgeComponent({
  badge,
  compact,
  fontScale,
  isModerated,
  onPress,
}: ChatBadgeProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (failedUrl === badge.url) {
    return null;
  }

  const textStyles = getChatTextStyles(fontScale, compact);
  const tint = badge.color;

  return (
    <ChatMessagePressable
      accessibilityLabel={badge.title}
      onPress={onPress ? () => onPress(badge) : undefined}
      style={[
        tint ? textStyles.badgeTintSlot : textStyles.badgeSlot,
        tint ? { backgroundColor: tint } : null,
        isModerated ? styles.moderatedBadge : null,
      ]}
      testID='chat-badge'
    >
      <ExpoImage
        source={badge.url}
        contentFit='contain'
        cachePolicy='memory-disk'
        useAppleWebpCodec={false}
        onError={() => setFailedUrl(badge.url)}
        style={textStyles.badgeArtwork}
      />
    </ChatMessagePressable>
  );
}

export const ChatBadge = memo(ChatBadgeComponent);
