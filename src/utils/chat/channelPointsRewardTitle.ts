import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';

import { unescapeIrcTag } from './unescapeIrcTag';

export const HIGHLIGHT_MY_MESSAGE_REWARD_TITLE = 'Highlight My Message';

export type ChannelPointsRewardTags = Record<
  string,
  string | boolean | undefined
>;

export type ChannelPointsRewardTagSource = {
  'msg-id'?: string;
  'msg-param-custom-reward-title'?: string;
  'msg-param-reward-title'?: string;
  'system-msg'?: string;
  'custom-reward-id'?: string;
  'room-id'?: string;
};

type RewardTitleTagSource = ChannelPointsRewardTagSource;

function rewardTitleFieldsFromUserstate(
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

export function isHighlightMyMessageTags(
  tags: RewardTitleTagSource | ChannelPointsRewardTags,
): boolean {
  return tags['msg-id'] === 'highlighted-message';
}

export function channelPointsRewardTitleFromSystemMsg(
  systemMsg: string,
): string | undefined {
  const line = unescapeIrcTag(systemMsg).trim();
  const match = /\bredeemed\s+(.+)$/i.exec(line);

  return match?.[1]?.trim() || undefined;
}

export function channelPointsRewardTitleFromTags(
  tags: RewardTitleTagSource | ChannelPointsRewardTags | UserNoticeTags,
): string | undefined {
  if (isHighlightMyMessageTags(tags)) {
    return HIGHLIGHT_MY_MESSAGE_REWARD_TITLE;
  }

  const raw =
    tags['msg-param-custom-reward-title'] ?? tags['msg-param-reward-title'];
  if (typeof raw === 'string') {
    const title = unescapeIrcTag(raw).trim();
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

export function channelPointsRewardTitleFromUserstate(
  userstate: UserStateTags,
): string | undefined {
  return channelPointsRewardTitleFromTags(rewardTitleFieldsFromUserstate(userstate));
}

export function channelPointsRewardTitleFieldsFromUserstate(
  userstate: UserStateTags,
): ChannelPointsRewardTagSource {
  return rewardTitleFieldsFromUserstate(userstate);
}
