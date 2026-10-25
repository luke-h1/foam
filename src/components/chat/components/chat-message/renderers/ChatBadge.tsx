import { memo, useState } from 'react';
import { View } from 'react-native';

import { Image as ExpoImage } from 'expo-image';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { ChatMessagePressable } from '../ChatMessagePressable';
import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import type { ChatFontScale } from '../util/chatScale';

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

  const artwork = (
    <ExpoImage
      source={badge.url}
      contentFit='contain'
      cachePolicy='memory-disk'
      useAppleWebpCodec={false}
      onError={() => setFailedUrl(badge.url)}
      style={textStyles.badgeArtwork}
    />
  );

  return (
    <ChatMessagePressable
      style={[textStyles.badgeSlot, isModerated ? styles.moderatedBadge : null]}
      testID='chat-badge'
      {...{
        accessibilityLabel: badge.title,
        onPress: onPress ? () => onPress(badge) : undefined,
      }}
    >
      {tint ? (
        <View
          testID='chat-badge-tint'
          style={[textStyles.badgeTintSlot, { backgroundColor: tint }]}
        >
          {artwork}
        </View>
      ) : (
        artwork
      )}
    </ChatMessagePressable>
  );
}

export const ChatBadge = memo(ChatBadgeComponent);
