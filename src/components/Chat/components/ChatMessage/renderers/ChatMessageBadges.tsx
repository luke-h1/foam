import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { Key, ReactNode } from 'react';
import { ChatMessagePressable } from '../ChatMessagePressable';
import { ChatInlineImage } from './ChatInlineImage';
import { styles } from '../RichChatMessage.styles';

interface ChatMessageBadgesProps {
  badges?: SanitisedBadgeSet[];
  compact: boolean;
  getMappingKey: (key: string, index: number) => Key;
  moderationNotice?: unknown;
  onBadgePress: (badge: SanitisedBadgeSet) => void;
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

  const renderedBadges: ReactNode[] = new Array(badges.length);
  let index = 0;
  for (const badge of badges) {
    renderedBadges[index] = (
      <ChatMessagePressable
        key={getMappingKey(
          `${badge.set}-${badge.id}-${badge.type}-${badge.url}`,
          index,
        )}
        onPress={() => onBadgePress(badge)}
      >
        <ChatInlineImage
          cacheVariant='badge'
          sourceUrl={badge.url}
          style={[
            styles.badge,
            compact && styles.badgeCompact,
            Boolean(moderationNotice) && styles.moderatedBadge,
          ]}
        />
      </ChatMessagePressable>
    );
    index += 1;
  }

  return renderedBadges;
}
