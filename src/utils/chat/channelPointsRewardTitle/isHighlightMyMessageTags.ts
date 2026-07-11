import {
  ChannelPointsRewardTags,
  RewardTitleTagSource,
} from '@app/utils/chat/channelPointsRewardTitle/types';

export function isHighlightMyMessageTags(
  tags: RewardTitleTagSource | ChannelPointsRewardTags,
): boolean {
  return tags['msg-id'] === 'highlighted-message';
}
