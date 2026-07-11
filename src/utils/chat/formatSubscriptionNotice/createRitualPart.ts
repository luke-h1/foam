import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { getTagValue } from '@app/utils/chat/formatSubscriptionNotice/getTagValue';
import { ParsedPart } from '@app/utils/chat/parsedPart';

export function createRitualPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<'ritual'> {
  const systemMsg =
    typeof tags['system-msg'] === 'string' ? tags['system-msg'] : '';

  return {
    type: 'ritual',
    displayName:
      getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '',
    ritualName: getTagValue(tags, 'msg-param-ritual-name'),
    systemMsg,
    message: messageText || undefined,
  };
}
