import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { getTagValue } from '@app/utils/chat/format-subscription-notice/get-tag-value';
import { withNoticeSubject } from '@app/utils/chat/format-subscription-notice/with-notice-subject';
import { ParsedPart } from '@app/utils/chat/parsed-part';

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
