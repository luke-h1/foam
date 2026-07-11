import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { createCharityDonationPart } from '../createCharityDonationPart';

describe('createCharityDonationPart', () => {
  test('createCharityDonationPart maps charity donation notices', () => {
    const part = createCharityDonationPart({
      'msg-id': 'charitydonation',
      'display-name': 'Donor',
      'msg-param-charity-name': 'Example Charity',
      'msg-param-donation-amount': '2500',
      'msg-param-exponent': '2',
      'msg-param-donation-currency': 'USD',
    });

    expect(part).toEqual<ParsedPart<'charitydonation'>>({
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
