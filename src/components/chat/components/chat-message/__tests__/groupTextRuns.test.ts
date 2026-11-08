import type { MessageToken } from '@app/types/chat/messageToken';

import { groupTextRuns, type TokenRun } from '../util/groupTextRuns';

describe('groupTextRuns', () => {
  test('joins neighbouring text tokens into one run at the first index', () => {
    const emote: MessageToken<'emote'> = {
      type: 'emote',
      content: 'Kappa',
      name: 'Kappa',
      id: '25',
      url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
      site: 'Twitch Global',
    };

    const message: MessageToken[] = [
      { type: 'text', content: 'hello ' },
      { type: 'text', content: 'there ' },
      emote,
      { type: 'text', content: ' bye' },
    ];

    expect(groupTextRuns(message)).toEqual<TokenRun<MessageToken>[]>([
      { content: 'hello there ', index: 0, kind: 'text' },
      { index: 2, kind: 'token', token: emote },
      { content: ' bye', index: 3, kind: 'text' },
    ]);
  });
});
