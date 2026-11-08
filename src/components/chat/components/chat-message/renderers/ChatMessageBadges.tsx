import type { ReactNode } from 'react';

import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalizeSevenTvBadge';

import { ChatBadge } from './ChatBadge';

interface ChatMessageBadgesProps {
  badges?: SanitisedBadgeSet[];
  density: ChatDensity;
  fontScale?: ChatFontScale;
  isModerated: boolean;
  onBadgePress?: (badge: SanitisedBadgeSet) => void;
}

export function ChatMessageBadges({
  badges,
  density,
  fontScale,
  isModerated,
  onBadgePress,
}: ChatMessageBadgesProps): ReactNode {
  if (!badges?.length) {
    return null;
  }

  const renderedBadges: ReactNode[] = [];

  for (const badge of badges) {
    const normalizedBadge = normalizeSevenTvBadge(badge);

    if (!normalizedBadge.url?.trim()) {
      continue;
    }

    renderedBadges.push(
      <ChatBadge
        key={`${renderedBadges.length}\u001f${normalizedBadge.provider}\u001f${normalizedBadge.set}\u001f${normalizedBadge.id}\u001f${normalizedBadge.url}`}
        {...{
          badge: normalizedBadge,
          density,
          fontScale,
          isModerated,
          onPress: onBadgePress,
        }}
      />,
    );
  }

  return renderedBadges;
}
