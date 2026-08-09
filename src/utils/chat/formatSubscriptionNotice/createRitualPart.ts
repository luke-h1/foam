import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { withNoticeSubject } from '@app/utils/chat/chatHealth/withNoticeSubject';
import { getTagValue } from '@app/utils/chat/formatSubscriptionNotice/getTagValue';
import { ParsedPart } from '@app/utils/chat/parsedPart';

export function createRitualPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<'ritual'> {
  const displayName =
    getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '';

  return {
    type: 'ritual',
    displayName,
    ritualName: getTagValue(tags, 'msg-param-ritual-name'),
    systemMsg: withNoticeSubject(getTagValue(tags, 'system-msg'), displayName),
    message: messageText || undefined,
  };
}
