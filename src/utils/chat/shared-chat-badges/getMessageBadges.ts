import type { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import { getPreferences } from '@app/store/preference-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { findBadges } from '@app/utils/chat/findBadges';

type ChatEmoteData = NonNullable<ReturnType<typeof getCurrentEmoteData>>;

interface GetMessageBadgesOptions {
  emoteData: ChatEmoteData;
  sourceBadge?: SanitisedBadgeSet | null;
  sourceChannelBadges?: SanitisedBadgeSet[] | null;
  userstate: UserStateTags;
}

function getEntitledBadge(userId: string): SanitisedBadgeSet | undefined {
  if (!getPreferences().show7tvBadges) {
    return undefined;
  }

  return getUserBadge(userId);
}

export function getMessageBadges({
  emoteData,
  sourceBadge,
  sourceChannelBadges,
  userstate,
}: GetMessageBadgesOptions): SanitisedBadgeSet[] {
  const foundBadges = findBadges({
    userstate,
    bttvBadges: emoteData.bttvBadges,
    chatterinoBadges: emoteData.chatterinoBadges,
    ffzChannelBadges: emoteData.ffzChannelBadges,
    ffzGlobalBadges: emoteData.ffzGlobalBadges,
    twitchChannelBadges: sourceChannelBadges ?? emoteData.twitchChannelBadges,
    twitchGlobalBadges: emoteData.twitchGlobalBadges,
    getEntitledBadge,
  });

  if (!sourceBadge) {
    return foundBadges;
  }

  return [
    sourceBadge,
    ...foundBadges.filter(badge => badge.set !== sourceBadge.set),
  ];
}
