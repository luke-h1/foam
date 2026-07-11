import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFromTags';
import { rewardTitleFieldsFromUserstate } from '@app/utils/chat/channelPointsRewardTitle/rewardTitleFieldsFromUserstate';

export function channelPointsRewardTitleFromUserstate(
  userstate: UserStateTags,
): string | undefined {
  return channelPointsRewardTitleFromTags(
    rewardTitleFieldsFromUserstate(userstate),
  );
}
