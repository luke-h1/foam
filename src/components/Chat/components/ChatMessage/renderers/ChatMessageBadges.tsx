import type { ReactNode } from 'react';

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
  moderationNotice?: unknown;
  onBadgePress?: (badge: SanitisedBadgeSet) => void;
}

export function ChatMessageBadges({
  badges,
  compact,
  fontScale,
  moderationNotice,
  onBadgePress,
}: ChatMessageBadgesProps): ReactNode {
  if (!badges?.length) {
    return null;
  }

  const textStyles = getChatTextStyles(fontScale, compact);

  const renderedBadges: ReactNode[] = [];
  for (const badge of badges) {
    const normalizedBadge = normalizeSevenTvBadge(badge);
    if (!normalizedBadge.url?.trim()) {
      continue;
    }

    const tint = normalizedBadge.color;
    const moderated = Boolean(moderationNotice) && styles.moderatedBadge;

    renderedBadges.push(
      <ChatMessagePressable
        key={`${renderedBadges.length}\u001f${normalizedBadge.set}\u001f${normalizedBadge.id}\u001f${normalizedBadge.type}\u001f${normalizedBadge.url}`}
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
          collapseWhenFailed
          maxRetryAttempts={0}
          showLoadingShimmer={false}
        />
      </ChatMessagePressable>,
    );
  }

  return renderedBadges;
}
