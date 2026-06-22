import { View } from 'react-native';
import type { Key, ReactNode } from 'react';

import { normalizeSevenTvBadge } from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

import { ChatMessagePressable } from '../ChatMessagePressable';
import { styles } from '../RichChatMessage.styles';
import { ChatInlineImage } from './ChatInlineImage';

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
      renderedBadges.push(
        <View
          key={getMappingKey(
            `missing-badge-${normalizedBadge.set}-${normalizedBadge.id}-${normalizedBadge.type}`,
            index,
          )}
          style={[
            styles.badge,
            compact && styles.badgeCompact,
            Boolean(moderationNotice) && styles.moderatedBadge,
          ]}
          testID='chat-badge-placeholder'
        />,
      );
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
