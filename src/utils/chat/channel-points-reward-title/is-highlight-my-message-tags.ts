import {
  ChannelPointsRewardTags,
  RewardTitleTagSource,
} from '@app/utils/chat/channel-points-reward-title/types';

export function isHighlightMyMessageTags(
  tags: RewardTitleTagSource | ChannelPointsRewardTags,
): boolean {
  return tags['msg-id'] === 'highlighted-message';
}
