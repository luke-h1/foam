import type { Key, ReactNode } from 'react';

import { normalizeSevenTvBadge } from '@app/components/Chat/util/normalizeSevenTvCosmetics/normalizeSevenTvBadge';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { ChatMessagePressable } from '../ChatMessagePressable';
import type { ChatFontScale } from '../chatScale';
import { getChatTextStyles } from '../chatTextStyles';
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

  const badgeStyle = getChatTextStyles(fontScale, compact).badge;

  const renderedBadges: ReactNode[] = [];
  let index = 0;
  for (const badge of badges) {
    const normalizedBadge = normalizeSevenTvBadge(badge);
    if (!normalizedBadge.url?.trim()) {
      index += 1;
      continue;
    }

    renderedBadges.push(
      <ChatMessagePressable
        key={getMappingKey(
          `${normalizedBadge.set}-${normalizedBadge.id}-${normalizedBadge.type}-${normalizedBadge.url}`,
          index,
        )}
        onPress={onBadgePress ? () => onBadgePress(normalizedBadge) : undefined}
      >
        <ChatInlineImage
          sourceUrl={normalizedBadge.url}
          style={[
            badgeStyle,
            Boolean(moderationNotice) && styles.moderatedBadge,
          ]}
          maxRetryAttempts={0}
          showLoadingShimmer={false}
        />
      </ChatMessagePressable>,
    );
    index += 1;
  }

  return renderedBadges;
}
