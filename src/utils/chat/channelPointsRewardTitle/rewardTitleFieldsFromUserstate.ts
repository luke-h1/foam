import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { RewardTitleTagSource } from '@app/utils/chat/channelPointsRewardTitle/types';

export function rewardTitleFieldsFromUserstate(
  userstate: UserStateTags,
): RewardTitleTagSource {
  return {
    'msg-id': userstate['msg-id'],
    'msg-param-custom-reward-title': userstate['msg-param-custom-reward-title'],
    'msg-param-reward-title': userstate['msg-param-reward-title'],
    'custom-reward-id': userstate['custom-reward-id'],
    'room-id': userstate['room-id'],
  };
}
