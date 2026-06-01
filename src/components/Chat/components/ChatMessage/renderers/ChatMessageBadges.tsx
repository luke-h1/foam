import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { Key, ReactNode } from 'react';
import { Button } from '../../../../Button/Button';
import { Image } from '../../../../Image/Image';
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
      <Button
        key={getMappingKey(
          `${badge.set}-${badge.id}-${badge.type}-${badge.url}`,
          index,
        )}
        onPress={() => onBadgePress(badge)}
      >
        <Image
          useNitro
          source={badge.url}
          cachePriority='visible'
          cacheVariant='badge'
          style={[
            styles.badge,
            compact && styles.badgeCompact,
            Boolean(moderationNotice) && styles.moderatedBadge,
          ]}
          transition={0}
        />
      </Button>
    );
    index += 1;
  }

  return renderedBadges;
}
