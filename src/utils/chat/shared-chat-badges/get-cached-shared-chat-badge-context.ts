import { getPreferences } from '@app/store/preference-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { getSharedChatSourceRoomId } from './get-shared-chat-source-room-id';
import { getTimedCacheValue } from './get-timed-cache-value';
import { sharedChatChannelBadgesCache } from './shared-chat-channel-badges-cache';
import { sharedChatSourceBadgeCache } from './shared-chat-source-badge-cache';

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
