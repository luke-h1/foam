import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { canRenderMessageInline } from '../canRenderMessageInline';

const text = (content: string) =>
  ({ type: 'text', content }) satisfies ParsedPart<'text'>;

const emote = (overrides: Partial<ParsedPart<'emote'>> = {}) =>
  ({
    type: 'emote',
    name: 'Kappa',
    content: 'Kappa',
    id: 'kappa-1',
    url: 'https://example.com/kappa.webp',
    width: 28,
    height: 28,
    ...overrides,
  }) satisfies ParsedPart<'emote'>;

describe('canRenderMessageInline', () => {
  test('accepts a body of text, mentions, links and plain emotes', () => {
    expect(
      canRenderMessageInline(
        [
          text('hey '),
          { type: 'mention', content: '@luke' } satisfies ParsedPart<'mention'>,
          {
            type: 'link',
            content: 'https://x.dev',
          } satisfies ParsedPart<'link'>,
          emote(),
        ],
        { hasPaint: false, isModerated: false },
      ),
    ).toBe(true);
  });

  test('rejects zero-width and overlaid emotes', () => {
    expect(
      canRenderMessageInline([emote({ zero_width: true })], {
        hasPaint: false,
        isModerated: false,
      }),
    ).toBe(false);

    expect(
      canRenderMessageInline([emote({ overlaid: [emote()] })], {
        hasPaint: false,
        isModerated: false,
      }),
    ).toBe(false);
  });

  test('rejects a painted or moderated body whatever its parts', () => {
    expect(
      canRenderMessageInline([text('hello')], {
        hasPaint: true,
        isModerated: false,
      }),
    ).toBe(false);

    expect(
      canRenderMessageInline([text('hello')], {
        hasPaint: false,
        isModerated: true,
      }),
    ).toBe(false);
  });

  test('rejects a part type that cannot live in a Text', () => {
    expect(
      canRenderMessageInline(
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
          } satisfies ParsedPart<'cheermote'>,
        ],
        { hasPaint: false, isModerated: false },
      ),
    ).toBe(false);
  });
});
