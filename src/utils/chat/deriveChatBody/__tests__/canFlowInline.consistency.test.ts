import { canFlowInline } from '@app/utils/chat/deriveChatBody/canFlowInline';
import { deriveChatBody } from '@app/utils/chat/deriveChatBody/deriveChatBody';
import { getMessageStructure } from '@app/utils/chat/deriveChatBody/getMessageStructure';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

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

/**
 * The inline rule used to be written three times; they now share one scan,
 * and this pins that.
 */
describe('inline eligibility is decided in one place', () => {
  const cases: { name: string; message: ParsedPart[]; inline: boolean }[] = [
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
      name: 'a part that cannot live in a Text',
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
        } satisfies ParsedPart<'cheermote'>,
      ],
      inline: false,
    },
  ];

  test.each(cases)(
    'the predicate, the structure scan and deriveChatBody agree on $name',
    ({ message, inline }) => {
      expect(
        canFlowInline(message, { hasPaint: false, isModerated: false }),
      ).toBe(inline);
      expect(getMessageStructure(message).canBeInline).toBe(inline);
      expect(deriveChatBody(message).canBeInline).toBe(inline);
    },
  );
});
