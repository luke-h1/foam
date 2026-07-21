import { getPreferences } from '@app/store/preferences/state';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { getSharedChatSourceRoomId } from './getSharedChatSourceRoomId';
import { getTimedCacheValue } from './getTimedCacheValue';
import { sharedChatChannelBadgesCache } from './sharedChatChannelBadgesCache';
import { sharedChatSourceBadgeCache } from './sharedChatSourceBadgeCache';

export function getCachedSharedChatBadgeContext(userstate: UserStateTags): {
  isComplete: boolean;
  sourceBadge: SanitisedBadgeSet | null | undefined;
  sourceChannelBadges: SanitisedBadgeSet[] | undefined;
} | null {
  const sourceRoomId = getSharedChatSourceRoomId(userstate);
  if (!sourceRoomId || !getPreferences().sharedChatEnabled) {
    return null;
  }

  const sourceBadge = getTimedCacheValue(
    sharedChatSourceBadgeCache,
    sourceRoomId,
  );
  const sourceChannelBadges = getTimedCacheValue(
    sharedChatChannelBadgesCache,
    sourceRoomId,
  );

  return {
    isComplete: sourceBadge !== undefined && sourceChannelBadges !== undefined,
    sourceBadge,
    sourceChannelBadges,
  };
}
