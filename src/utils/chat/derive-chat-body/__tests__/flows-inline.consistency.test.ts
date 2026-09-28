import { deriveChatBody } from '@app/utils/chat/derive-chat-body/derive-chat-body';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flows-inline';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/get-message-structure';
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

/**
 * The inline rule used to be written three times; they now share one scan,
 * and this pins that.
 */
describe('inline eligibility is decided in one place', () => {
  const cases: { name: string; message: MessageToken[]; inline: boolean }[] = [
    { name: 'plain text', message: [text('hello')], inline: true },
    {
      name: 'text plus a plain emote',
      message: [text('hi '), emote()],
      inline: true,
    },
    {
      name: 'a zero-width emote',
      message: [emote({ zero_width: true })],
      inline: false,
    },
    {
      name: 'an overlaid emote',
      message: [emote({ overlaid: [emote()] })],
      inline: false,
    },
    {
      name: 'a token that cannot live in a Text',
      message: [
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
      inline: false,
    },
  ];

  test.each(cases)(
    'the predicate, the structure scan and deriveChatBody agree on $name',
    ({ message, inline }) => {
      expect(
        flowsInline(message, { hasPaint: false, isModerated: false }),
      ).toBe(inline);

      expect(getMessageStructure(message).fitsInOneText).toBe(inline);
      expect(deriveChatBody(message).fitsInOneText).toBe(inline);
    },
  );
});
