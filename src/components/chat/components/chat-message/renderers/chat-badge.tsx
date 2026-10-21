import { memo, useState } from 'react';

import { Image as ExpoImage } from 'expo-image';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { ChatMessagePressable } from '../chat-message-pressable';
import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import type { ChatFontScale } from '../util/chat-scale';

interface ChatBadgeProps {
  badge: SanitisedBadgeSet;
  compact: boolean;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  onPress?: (badge: SanitisedBadgeSet) => void;
}

/**
 * Renders straight off the url, not the shared decoded-ImageRef cache: that
 * cache evicts under pressure and a dropped ref reads as a permanent gap.
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
      style={[
        tint ? textStyles.badgeTintSlot : textStyles.badgeSlot,
        tint ? { backgroundColor: tint } : null,
        isModerated ? styles.moderatedBadge : null,
      ]}
      testID='chat-badge'
      {...{
        accessibilityLabel: badge.title,
        onPress: onPress ? () => onPress(badge) : undefined,
      }}
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
