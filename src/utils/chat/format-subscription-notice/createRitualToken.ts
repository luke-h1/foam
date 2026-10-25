import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { getTagValue } from '@app/utils/chat/format-subscription-notice/getTagValue';
import { withNoticeSubject } from '@app/utils/chat/format-subscription-notice/withNoticeSubject';
import type { MessageToken } from '@app/utils/chat/messageToken';

export function createRitualPart(
  tags: UserNoticeTags,
  messageText?: string,
): MessageToken<'ritual'> {
  const displayName =
    getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '';

  return {
    type: 'ritual' as const,
    displayName,
    ritualName: getTagValue(tags, 'msg-param-ritual-name'),
    systemMsg: withNoticeSubject(getTagValue(tags, 'system-msg'), displayName),
    message: messageText || undefined,
  };
}
