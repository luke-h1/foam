import { formatReplyPrefix } from '../formatReplyPrefix';

describe('formatReplyPrefix', () => {
  test('puts a mention and a space before the reply', () => {
    expect(formatReplyPrefix('luke')).toEqual('@luke ');
  });
});
