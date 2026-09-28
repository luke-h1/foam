import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { rewardTitleFieldsFromUserstate } from '@app/utils/chat/channel-points-reward-title/reward-title-fields-from-userstate';
import { ChannelPointsRewardTagSource } from '@app/utils/chat/channel-points-reward-title/types';

export function channelPointsRewardTitleFieldsFromUserstate(
  userstate: UserStateTags,
): ChannelPointsRewardTagSource {
  return rewardTitleFieldsFromUserstate(userstate);
}
