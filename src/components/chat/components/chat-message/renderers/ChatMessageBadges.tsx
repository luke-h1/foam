import type { ReactNode } from 'react';

import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalizeSevenTvBadge';

import { ChatBadge } from './ChatBadge';

/**
 * `normalizeSevenTvBadge` returns one object per badge, so its identity part
 * of the React key is built once, not on every render.
 */
const badgeKeys = new WeakMap<SanitisedBadgeSet, string>();

function getBadgeKey(badge: SanitisedBadgeSet): string {
  const cached = badgeKeys.get(badge);

  if (cached !== undefined) {
    return cached;
  }

  const key = `${badge.provider}\u001f${badge.set}\u001f${badge.id}\u001f${badge.url}`;
  badgeKeys.set(badge, key);
  return key;
}

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
        key={`${renderedBadges.length}\u001f${getBadgeKey(normalizedBadge)}`}
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
