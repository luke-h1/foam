import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';

import { unescapeIrcTag } from './unescapeIrcTag';

export function channelPointsRewardTitleFromUserstate(
  userstate: UserStateTags,
): string | undefined {
  const raw =
    userstate['msg-param-custom-reward-title'] ??
    userstate['msg-param-reward-title'];
  if (typeof raw !== 'string') {
    return undefined;
  }
  const t = unescapeIrcTag(raw).trim();
  return t || undefined;
}
