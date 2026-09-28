import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-from-tags';
import { rewardTitleFieldsFromUserstate } from '@app/utils/chat/channel-points-reward-title/reward-title-fields-from-userstate';

export function channelPointsRewardTitleFromUserstate(
  userstate: UserStateTags,
): string | undefined {
  return channelPointsRewardTitleFromTags(
    rewardTitleFieldsFromUserstate(userstate),
  );
}
