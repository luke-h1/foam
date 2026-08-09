import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { withNoticeSubject } from '@app/utils/chat/chatHealth/withNoticeSubject';
import { formatCharityAmount } from '@app/utils/chat/formatCharityAmount';
import { getTagValue } from '@app/utils/chat/formatSubscriptionNotice/getTagValue';
import { ParsedPart } from '@app/utils/chat/parsedPart';

export function createCharityDonationPart(
  tags: UserNoticeTags,
  messageText?: string,
): ParsedPart<'charitydonation'> {
  const currency = getTagValue(tags, 'msg-param-donation-currency') || 'USD';
  const displayName =
    getTagValue(tags, 'display-name') || getTagValue(tags, 'login') || '';
  const systemMsg = withNoticeSubject(
    getTagValue(tags, 'system-msg'),
    displayName,
  );

  return {
    type: 'charitydonation',
    displayName,
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
