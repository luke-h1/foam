import type { MessageToken } from '@app/types/chat/messageToken';

import { parseMessageText } from '../util/parseMessageText';

describe('parseMessageText', () => {
  test('gives no tokens for blank or missing text', () => {
    expect([parseMessageText(undefined), parseMessageText('   ')]).toEqual([
      [],
      [],
    ]);
  });

  test('trims the text before it reaches the parser', () => {
    const parse = jest.fn((text: string): MessageToken[] => [
      { type: 'text', content: `parsed:${text}` },
    ]);

    expect(parseMessageText('  hi  ', parse)).toEqual<MessageToken[]>([
      { type: 'text', content: 'parsed:hi' },
    ]);
  });

  test('falls back to one text token without a parser or a parse result', () => {
    expect([
      parseMessageText(' hi ', undefined),
      parseMessageText(' hi ', () => []),
    ]).toEqual<MessageToken[][]>([
      [{ type: 'text', content: 'hi' }],
      [{ type: 'text', content: 'hi' }],
    ]);
  });
});
