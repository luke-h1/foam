import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { formatCharityAmount } from '@app/utils/chat/formatCharityAmount';
import { getTagValue } from '@app/utils/chat/formatSubscriptionNotice/getTagValue';
import { ParsedPart } from '@app/utils/chat/parsedPart';

export function createCharityDonationPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<'charitydonation'> {
  const currency = getTagValue(tags, 'msg-param-donation-currency') || 'USD';
  const systemMsg =
    typeof tags['system-msg'] === 'string' ? tags['system-msg'] : '';

  return {
    type: 'charitydonation',
    displayName:
      getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '',
    charityName: getTagValue(tags, 'msg-param-charity-name') || 'charity',
    amount: formatCharityAmount(
      getTagValue(tags, 'msg-param-donation-amount'),
      getTagValue(tags, 'msg-param-exponent'),
      currency,
    ),
    currency,
    systemMsg,
    message: messageText || undefined,
  };
}
