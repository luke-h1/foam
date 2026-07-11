import type { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { findBadges } from '@app/utils/chat/findBadges';

type ChatEmoteData = NonNullable<ReturnType<typeof getCurrentEmoteData>>;

export function getMessageBadges({
  emoteData,
  sourceBadge,
  sourceChannelBadges,
  userstate,
}: {
  emoteData: ChatEmoteData;
  sourceBadge?: SanitisedBadgeSet | null;
  sourceChannelBadges?: SanitisedBadgeSet[] | null;
  userstate: UserStateTags;
}): SanitisedBadgeSet[] {
  const foundBadges = findBadges({
    userstate,
    bttvBadges: emoteData.bttvBadges,
    chatterinoBadges: emoteData.chatterinoBadges,
    ffzChannelBadges: emoteData.ffzChannelBadges,
    ffzGlobalBadges: emoteData.ffzGlobalBadges,
    twitchChannelBadges: sourceChannelBadges ?? emoteData.twitchChannelBadges,
    twitchGlobalBadges: emoteData.twitchGlobalBadges,
  });

  if (!sourceBadge) {
    return foundBadges;
  }

  return [
    sourceBadge,
    ...foundBadges.filter(badge => badge.set !== sourceBadge.set),
  ];
}
