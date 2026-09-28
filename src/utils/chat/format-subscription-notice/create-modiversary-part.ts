import { ModiversaryTags } from '@app/types/chat/irc-tags/usernotice';
import { getTagValue } from '@app/utils/chat/format-subscription-notice/get-tag-value';
import { withNoticeSubject } from '@app/utils/chat/format-subscription-notice/with-notice-subject';
import { ParsedPart } from '@app/utils/chat/parsed-part';

export function createModiversaryPart(
  tags: ModiversaryTags,
  messageText?: string,
): ParsedPart<'modiversary'> {
  const displayName =
    getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '';

  const months = getTagValue(tags, 'msg-param-months');

  const systemMsg = withNoticeSubject(
    getTagValue(tags, 'system-msg'),
    displayName,
  );

  const fallback =
    displayName && months
      ? `${displayName} has been a moderator for ${months} months!`
      : '';

  return {
    type: 'modiversary',
    displayName,
    login: getTagValue(tags, 'login'),
    months,
    systemMsg: systemMsg || fallback,
    content: messageText?.trim() ?? '',
  };
}
