import { getPreferences } from '@app/store/preference-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { getSharedChatSourceRoomId } from '@app/utils/chat/shared-chat-badges/getSharedChatSourceRoomId';
import { getTimedCacheValue } from '@app/utils/chat/shared-chat-badges/getTimedCacheValue';
import { sharedChatChannelBadgesCache } from '@app/utils/chat/shared-chat-badges/sharedChatChannelBadgesCache';
import { sharedChatSourceBadgeCache } from '@app/utils/chat/shared-chat-badges/sharedChatSourceBadgeCache';

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
