import { flowsInline } from '@app/utils/chat/derive-chat-body/flows-inline';
import type { MessageToken } from '@app/utils/chat/message-token';

const text = (content: string) =>
  ({ type: 'text', content }) satisfies MessageToken<'text'>;

const emote = (overrides: Partial<MessageToken<'emote'>> = {}) =>
  ({
    type: 'emote',
    name: 'Kappa',
    content: 'Kappa',
    id: 'kappa-1',
    url: 'https://example.com/kappa.webp',
    width: 28,
    height: 28,
    ...overrides,
  }) satisfies MessageToken<'emote'>;

describe('flowsInline', () => {
  test('accepts a body of text, mentions, links and plain emotes', () => {
    expect(
      flowsInline(
        [
          text('hey '),
          {
            type: 'mention',
            content: '@luke',
          } satisfies MessageToken<'mention'>,
          {
            type: 'link',
            content: 'https://x.dev',
          } satisfies MessageToken<'link'>,
          emote(),
        ],
        { hasPaint: false, isModerated: false },
      ),
    ).toBe(true);
  });

  test('rejects zero-width and overlaid emotes', () => {
    expect(
      flowsInline([emote({ zero_width: true })], {
        hasPaint: false,
        isModerated: false,
      }),
    ).toBe(false);

    expect(
      flowsInline([emote({ overlaid: [emote()] })], {
        hasPaint: false,
        isModerated: false,
      }),
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
});
