import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { normalizeSevenTvBadge } from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import type { Key, ReactNode } from 'react';
import { ChatMessagePressable } from '../ChatMessagePressable';
import { ChatInlineImage } from './ChatInlineImage';
import { styles } from '../RichChatMessage.styles';

interface ChatMessageBadgesProps {
  badges?: SanitisedBadgeSet[];
  compact: boolean;
  getMappingKey: (key: string, index: number) => Key;
  moderationNotice?: unknown;
  onBadgePress?: (badge: SanitisedBadgeSet) => void;
}

export function ChatMessageBadges({
  badges,
  compact,
  getMappingKey,
  moderationNotice,
  onBadgePress,
}: ChatMessageBadgesProps): ReactNode {
  if (!badges?.length) {
    return null;
  }

  const renderedBadges: ReactNode[] = [];
  let index = 0;
  for (const badge of badges) {
    const normalizedBadge = normalizeSevenTvBadge(badge);
    if (!normalizedBadge.url?.trim()) {
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
          cacheVariant='badge'
          sourceUrl={normalizedBadge.url}
          style={[
            styles.badge,
            compact && styles.badgeCompact,
            Boolean(moderationNotice) && styles.moderatedBadge,
          ]}
        />
      </ChatMessagePressable>,
    );
    index += 1;
  }

  return renderedBadges;
}
