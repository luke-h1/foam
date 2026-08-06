import type { Key, ReactNode } from 'react';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normalizeSevenTvBadge } from '@app/utils/seventv/cosmetics/normalizeSevenTvBadge';

import { ChatMessagePressable } from '../ChatMessagePressable';
import type { ChatFontScale } from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';
import { ChatInlineImage } from './ChatInlineImage';

interface ChatMessageBadgesProps {
  badges?: SanitisedBadgeSet[];
  compact: boolean;
  fontScale?: ChatFontScale;
  getMappingKey: (key: string, index: number) => Key;
  moderationNotice?: unknown;
  onBadgePress?: (badge: SanitisedBadgeSet) => void;
}

export function ChatMessageBadges({
  badges,
  compact,
  fontScale,
  getMappingKey,
  moderationNotice,
  onBadgePress,
}: ChatMessageBadgesProps): ReactNode {
  if (!badges?.length) {
    return null;
  }

  const textStyles = getChatTextStyles(fontScale, compact);

  const renderedBadges: ReactNode[] = [];
  let index = 0;
  for (const badge of badges) {
    const normalizedBadge = normalizeSevenTvBadge(badge);
    if (!normalizedBadge.url?.trim()) {
      index += 1;
      continue;
    }

    // Only FFZ carries a colour, and every FFZ badge is a white-on-transparent
    // mask meant to sit on it - drawn raw, a channel's mod/VIP art is a white
    // blob on the chat surface rather than the badge the channel uploaded.
    const tint = normalizedBadge.color;
    const moderated = Boolean(moderationNotice) && styles.moderatedBadge;

    renderedBadges.push(
      <ChatMessagePressable
        key={getMappingKey(
          `${normalizedBadge.set}-${normalizedBadge.id}-${normalizedBadge.type}-${normalizedBadge.url}`,
          index,
        )}
        onPress={onBadgePress ? () => onBadgePress(normalizedBadge) : undefined}
        style={
          tint
            ? [textStyles.badgeTintSlot, { backgroundColor: tint }, moderated]
            : undefined
        }
        testID='chat-badge'
      >
        <ChatInlineImage
          sourceUrl={normalizedBadge.url}
          style={
            tint ? textStyles.badgeTintArtwork : [textStyles.badge, moderated]
          }
          maxRetryAttempts={0}
          showLoadingShimmer={false}
        />
      </ChatMessagePressable>,
    );
    index += 1;
  }

  return renderedBadges;
}
