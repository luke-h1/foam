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

  const badgeStyle = getChatTextStyles(fontScale, compact).badge;

  const renderedBadges: ReactNode[] = [];
  for (const badge of badges) {
    const normalizedBadge = normalizeSevenTvBadge(badge);
    if (!normalizedBadge.url?.trim()) {
      continue;
    }

    renderedBadges.push(
      <ChatMessagePressable
        key={`${renderedBadges.length}\u001f${normalizedBadge.set}\u001f${normalizedBadge.id}\u001f${normalizedBadge.type}\u001f${normalizedBadge.url}`}
        onPress={onBadgePress ? () => onBadgePress(normalizedBadge) : undefined}
      >
        <ChatInlineImage
          sourceUrl={normalizedBadge.url}
          style={[
            badgeStyle,
            Boolean(moderationNotice) && styles.moderatedBadge,
          ]}
          collapseWhenFailed
          maxRetryAttempts={0}
          showLoadingShimmer={false}
        />
      </ChatMessagePressable>,
    );
  }

  return renderedBadges;
}
