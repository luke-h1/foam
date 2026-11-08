import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { channelPointsRewardTitleFromSystemMsg } from '@app/utils/chat/channel-points-reward-title/channelPointsRewardTitleFromSystemMsg';
import { isHighlightMyMessageTags } from '@app/utils/chat/channel-points-reward-title/isHighlightMyMessageTags';
import type {
  ChannelPointsRewardTags,
  ChannelPointsRewardTagSource,
} from '@app/utils/chat/channel-points-reward-title/types';

const HIGHLIGHT_MY_MESSAGE_REWARD_TITLE = 'Highlight My Message';

export function channelPointsRewardTitleFromTags(
  tags: ChannelPointsRewardTagSource | ChannelPointsRewardTags | UserNoticeTags,
): string | undefined {
  if (isHighlightMyMessageTags(tags)) {
    return HIGHLIGHT_MY_MESSAGE_REWARD_TITLE;
  }

  const title = (
    tags['msg-param-custom-reward-title'] ?? tags['msg-param-reward-title']
  )?.trim();

  if (title) {
    return title;
  }

  const systemMsg = tags['system-msg'];

  if (systemMsg !== undefined) {
    return channelPointsRewardTitleFromSystemMsg(systemMsg);
  }

  return undefined;
}
