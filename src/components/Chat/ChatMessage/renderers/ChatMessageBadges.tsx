import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { normalizeSevenTvBadge } from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import type { Key, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { ChatAssetContextMenu } from '../contextMenu/ChatAssetContextMenu';
import { ChatAssetContextPreview } from '../contextMenu/ChatAssetContextPreview';
import {
  buildBadgeMenuActions,
  createBadgeMenuActionHandler,
} from '../contextMenu/buildBadgeMenuActions';
import { ChatInlineImage } from './ChatInlineImage';
import { styles } from '../RichChatMessage.styles';

interface ChatMessageBadgesProps {
  badges?: SanitisedBadgeSet[];
  compact: boolean;
  getMappingKey: (key: string, index: number) => Key;
  moderationNotice?: unknown;
}

function ChatBadgeItem({
  badge,
  compact,
  moderationNotice,
}: {
  badge: SanitisedBadgeSet;
  compact: boolean;
  moderationNotice?: unknown;
}) {
  const menuActions = useMemo(() => buildBadgeMenuActions(badge), [badge]);
  const handleMenuAction = useCallback(
    (actionId: string) => {
      void createBadgeMenuActionHandler(badge)(actionId);
    },
    [badge],
  );
  const imageStyle = [
    styles.badge,
    compact && styles.badgeCompact,
    Boolean(moderationNotice) && styles.moderatedBadge,
  ];

  const previewSize = compact ? 64 : 72;

  return (
    <ChatAssetContextMenu
      actions={menuActions}
      onPressAction={handleMenuAction}
      preview={
        <ChatAssetContextPreview
          cacheVariant='badge'
          label={badge.title}
          sourceHeight={previewSize}
          sourceUrl={badge.url}
          sourceWidth={previewSize}
          stageSize={previewSize}
        />
      }
      testID='chat-badge-context-menu'
    >
      <ChatInlineImage
        cacheVariant='badge'
        sourceUrl={badge.url}
        style={imageStyle}
      />
    </ChatAssetContextMenu>
  );
}

export function ChatMessageBadges({
  badges,
  compact,
  getMappingKey,
  moderationNotice,
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
      <ChatBadgeItem
        key={getMappingKey(
          `${normalizedBadge.set}-${normalizedBadge.id}-${normalizedBadge.type}-${normalizedBadge.url}`,
          index,
        )}
        badge={normalizedBadge}
        compact={compact}
        moderationNotice={moderationNotice}
      />,
    );
    index += 1;
  }

  return renderedBadges;
}
