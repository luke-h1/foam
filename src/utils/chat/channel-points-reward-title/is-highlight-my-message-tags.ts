import type {
  ChannelPointsRewardTags,
  ChannelPointsRewardTagSource,
} from '@app/utils/chat/channel-points-reward-title/types';

export function isHighlightMyMessageTags(
  tags: ChannelPointsRewardTagSource | ChannelPointsRewardTags,
): boolean {
  return tags['msg-id'] === 'highlighted-message';
}
