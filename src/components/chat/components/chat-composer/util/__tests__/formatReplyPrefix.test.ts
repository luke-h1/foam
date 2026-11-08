import { messageLength } from '@app/utils/chat/maxMessageLength';

import { formatReplyPrefix } from '../formatReplyPrefix';

describe('formatReplyPrefix', () => {
  test('puts a mention and a space before the reply', () => {
    expect(formatReplyPrefix('luke')).toEqual('@luke ');
  });

  test('counts a username outside the BMP in codepoints', () => {
    expect(messageLength(formatReplyPrefix('😀'))).toEqual(3);
  });
});
