import { useSelector } from '@legendapp/state/react';

import type { PaintData } from '@app/types/seven-tv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { chatStore$ } from '../observables/chat-store';

export const useUserPaint = (userId?: string): PaintData | null =>
  useSelector(() => {
    if (!userId) {
      return null;
    }

    const paintId = chatStore$.userPaintIds[userId]?.get();
    return paintId ? (chatStore$.paints[paintId]?.get() ?? null) : null;
  });

export const useUserSevenTvBadge = (
  userId?: string,
): SanitisedBadgeSet | null =>
  useSelector(() => {
    if (!userId) {
      return null;
    }

    const badgeId = chatStore$.userBadgeIds[userId]?.get();
    return badgeId ? (chatStore$.badges[badgeId]?.get() ?? null) : null;
  });
