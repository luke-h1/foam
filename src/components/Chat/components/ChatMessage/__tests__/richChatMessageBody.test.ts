import { getPartIdentity } from '@app/components/Chat/util/richChatMessageHelpers';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

describe('richChatMessageBody', () => {
  test('creates position-based identities for repeated content parts', () => {
    const repeatedTextPart = {
      type: 'text',
      content: 'UNKNOWN FOR NA! ',
    } satisfies ParsedPart<'text'>;
    const repeatedEmotePart = {
      type: 'emote',
      id: '25',
      content: 'Kappa',
      name: 'Kappa',
    } satisfies ParsedPart<'emote'>;

    expect(getPartIdentity(repeatedTextPart, 0)).toBe('text-0');
    expect(getPartIdentity(repeatedTextPart, 2)).toBe('text-2');
    expect(getPartIdentity(repeatedEmotePart, 1)).toBe('emote-1');
    expect(getPartIdentity(repeatedEmotePart, 3)).toBe('emote-3');
    expect(getPartIdentity(repeatedTextPart, 0)).not.toContain(
      repeatedTextPart.content,
    );
    expect(getPartIdentity(repeatedEmotePart, 1)).not.toContain(
      repeatedEmotePart.id,
    );
  });
});
