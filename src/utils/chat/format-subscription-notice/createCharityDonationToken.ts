import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { MessageToken } from '@app/types/chat/messageToken';
import { getTagValue } from '@app/utils/chat/format-subscription-notice/getTagValue';
import { withNoticeSubject } from '@app/utils/chat/format-subscription-notice/withNoticeSubject';
import { formatCharityAmount } from '@app/utils/chat/formatCharityAmount';

export function createCharityDonationToken(
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
    type: 'charitydonation' as const,
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
