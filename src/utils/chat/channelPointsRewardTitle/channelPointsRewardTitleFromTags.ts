import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { channelPointsRewardTitleFromSystemMsg } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFromSystemMsg';
import { isHighlightMyMessageTags } from '@app/utils/chat/channelPointsRewardTitle/isHighlightMyMessageTags';
import {
  ChannelPointsRewardTags,
  RewardTitleTagSource,
} from '@app/utils/chat/channelPointsRewardTitle/types';

const HIGHLIGHT_MY_MESSAGE_REWARD_TITLE = 'Highlight My Message';

function readStringTag(
  value: string | boolean | undefined,
): string | undefined {
  if (value === undefined || value === true || value === false) {
    return undefined;
  }
  return value;
}

export function channelPointsRewardTitleFromTags(
  tags: RewardTitleTagSource | ChannelPointsRewardTags | UserNoticeTags,
): string | undefined {
  if (isHighlightMyMessageTags(tags)) {
    return HIGHLIGHT_MY_MESSAGE_REWARD_TITLE;
  }

  const raw = readStringTag(
    tags['msg-param-custom-reward-title'] ?? tags['msg-param-reward-title'],
  );
  const title = raw?.trim();
  if (title) {
    return title;
  }

  const systemMsg = readStringTag(tags['system-msg']);
  if (systemMsg !== undefined) {
    return channelPointsRewardTitleFromSystemMsg(systemMsg);
  }

  return undefined;
}
