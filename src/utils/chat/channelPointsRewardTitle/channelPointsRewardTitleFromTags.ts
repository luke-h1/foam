import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { channelPointsRewardTitleFromSystemMsg } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFromSystemMsg';
import { isHighlightMyMessageTags } from '@app/utils/chat/channelPointsRewardTitle/isHighlightMyMessageTags';
import {
  ChannelPointsRewardTags,
  RewardTitleTagSource,
} from '@app/utils/chat/channelPointsRewardTitle/types';

const HIGHLIGHT_MY_MESSAGE_REWARD_TITLE = 'Highlight My Message';

export function channelPointsRewardTitleFromTags(
  tags: RewardTitleTagSource | ChannelPointsRewardTags | UserNoticeTags,
): string | undefined {
  if (isHighlightMyMessageTags(tags)) {
    return HIGHLIGHT_MY_MESSAGE_REWARD_TITLE;
  }

  const raw =
    tags['msg-param-custom-reward-title'] ?? tags['msg-param-reward-title'];
  if (typeof raw === 'string') {
    const title = raw.trim();
    if (title) {
      return title;
    }
  }

  const systemMsg = tags['system-msg'];
  if (typeof systemMsg === 'string') {
    return channelPointsRewardTitleFromSystemMsg(systemMsg);
  }

  return undefined;
}
