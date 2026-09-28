import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { formatCharityAmount } from '@app/utils/chat/format-charity-amount';
import { getTagValue } from '@app/utils/chat/format-subscription-notice/get-tag-value';
import { withNoticeSubject } from '@app/utils/chat/format-subscription-notice/with-notice-subject';
import { MessageToken } from '@app/utils/chat/message-token';

export function createCharityDonationPart(
  tags: UserNoticeTags,
  messageText?: string,
): MessageToken<'charitydonation'> {
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
