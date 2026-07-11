import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { rewardTitleFieldsFromUserstate } from '@app/utils/chat/channelPointsRewardTitle/rewardTitleFieldsFromUserstate';
import { ChannelPointsRewardTagSource } from '@app/utils/chat/channelPointsRewardTitle/types';

export function channelPointsRewardTitleFieldsFromUserstate(
  userstate: UserStateTags,
): ChannelPointsRewardTagSource {
  return rewardTitleFieldsFromUserstate(userstate);
}
