import type { MessageToken } from '@app/utils/chat/message-token';

import { createCharityDonationPart } from '../create-charity-donation-token';

describe('createCharityDonationPart', () => {
  test('createCharityDonationPart maps charity donation notices', () => {
    const token = createCharityDonationPart({
      'msg-id': 'charitydonation',
      'display-name': 'Donor',
      'msg-param-charity-name': 'Example Charity',
      'msg-param-donation-amount': '2500',
      'msg-param-exponent': '2',
      'msg-param-donation-currency': 'USD',
    });

    expect(token).toEqual<MessageToken<'charitydonation'>>({
      type: 'charitydonation',
      displayName: 'Donor',
      charityName: 'Example Charity',
      amount: '$25.00',
      currency: 'USD',
      systemMsg: '',
      message: undefined,
    });
  });
});
