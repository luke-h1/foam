import type { MessageToken } from '@app/types/chat/messageToken';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flowsInline';

import {
  emote,
  link,
  mention,
  text,
} from './__fixtures__/deriveChatBody.fixture';

describe('flowsInline', () => {
  test('accepts a body of text, mentions, links and plain emotes', () => {
    expect(
      flowsInline(
        [text('hey '), mention('@luke'), link('https://x.dev'), emote('Kappa')],
        { hasPaint: false, isModerated: false },
      ),
    ).toBe(true);
  });

  test('rejects zero-width and overlaid emotes', () => {
    expect(
      flowsInline([emote('RainTime', true)], {
        hasPaint: false,
        isModerated: false,
      }),
    ).toBe(false);

    expect(
      flowsInline(
        [{ ...emote('Kappa'), overlaid: [emote('RainTime', true)] }],
        {
          hasPaint: false,
          isModerated: false,
        },
      ),
    ).toBe(false);
  });

  test('rejects a painted or moderated body whatever its tokens', () => {
    expect(
      flowsInline([text('hello')], {
        hasPaint: true,
        isModerated: false,
      }),
    ).toBe(false);

    expect(
      flowsInline([text('hello')], {
        hasPaint: false,
        isModerated: true,
      }),
    ).toBe(false);
  });

  test('rejects a token type that cannot live in a Text', () => {
    expect(
      flowsInline(
        [
          text('cheer '),
          {
            type: 'cheermote',
            content: 'Cheer100',
            cheermote: {
              bits: 100,
              color: '#9c3ee8',
              prefix: 'Cheer',
              static_url: 'https://example.com/cheer100-static.png',
              url: 'https://example.com/cheer100.gif',
            },
          } satisfies MessageToken<'cheermote'>,
        ],
        { hasPaint: false, isModerated: false },
      ),
    ).toBe(false);
  });

  test('rejects a chat GIF token', () => {
    expect(
      flowsInline(
        [
          {
            type: 'gif',
            content: '[yes gif]',
            gifId: 'abc123',
            url: 'https://example.com/giphy.gif',
          } satisfies MessageToken<'gif'>,
        ],
        { hasPaint: false, isModerated: false },
      ),
    ).toBe(false);
  });
});
