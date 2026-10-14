import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ChannelPointsRewardTagSource } from '@app/utils/chat/channel-points-reward-title/types';

export function rewardTitleFieldsFromUserstate(
  userstate: UserStateTags,
): ChannelPointsRewardTagSource {
  return {
    'msg-id': userstate['msg-id'],
    'msg-param-custom-reward-title': userstate['msg-param-custom-reward-title'],
    'msg-param-reward-title': userstate['msg-param-reward-title'],
    'custom-reward-id': userstate['custom-reward-id'],
    'room-id': userstate['room-id'],
  };
}
