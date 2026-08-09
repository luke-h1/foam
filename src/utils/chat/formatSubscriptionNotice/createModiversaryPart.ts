import { ModiversaryTags } from '@app/types/chat/irc-tags/usernotice';
import { getTagValue } from '@app/utils/chat/formatSubscriptionNotice/getTagValue';
import { withNoticeSubject } from '@app/utils/chat/formatSubscriptionNotice/withNoticeSubject';
import { ParsedPart } from '@app/utils/chat/parsedPart';

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
