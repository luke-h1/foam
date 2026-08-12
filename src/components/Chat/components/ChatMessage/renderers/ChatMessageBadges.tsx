import type { ReactNode } from 'react';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normalizeSevenTvBadge } from '@app/utils/seventv/cosmetics/normalizeSevenTvBadge';

import type { ChatFontScale } from '../chatScale';
import { ChatBadge } from './ChatBadge';

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

  const isModerated = Boolean(moderationNotice);
  const renderedBadges: ReactNode[] = [];

  for (const badge of badges) {
    const normalizedBadge = normalizeSevenTvBadge(badge);
    if (!normalizedBadge.url?.trim()) {
      continue;
    }

    renderedBadges.push(
      <ChatBadge
        key={`${renderedBadges.length}\u001f${normalizedBadge.provider}\u001f${normalizedBadge.set}\u001f${normalizedBadge.id}\u001f${normalizedBadge.url}`}
        badge={normalizedBadge}
        compact={compact}
        fontScale={fontScale}
        isModerated={isModerated}
        onPress={onBadgePress}
      />,
    );
  }

  return renderedBadges;
}
