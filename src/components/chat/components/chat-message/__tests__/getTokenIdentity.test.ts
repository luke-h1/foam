import { getTokenIdentity } from '@app/components/chat/util/chat-row/getTokenIdentity';
import type { MessageToken } from '@app/types/chat/messageToken';

describe('getTokenIdentity', () => {
  test('creates position-based identities for repeated content tokens', () => {
    const repeatedTextPart = {
      type: 'text',
      content: 'UNKNOWN FOR NA! ',
    } satisfies MessageToken<'text'>;

    const repeatedEmotePart = {
      type: 'emote',
      id: '25',
      content: 'Kappa',
      name: 'Kappa',
    } satisfies MessageToken<'emote'>;

    expect(getTokenIdentity(repeatedTextPart, 0)).toBe('text-0');

    expect(getTokenIdentity(repeatedTextPart, 2)).toBe('text-2');

    expect(getTokenIdentity(repeatedEmotePart, 1)).toBe('emote-1');

    expect(getTokenIdentity(repeatedEmotePart, 3)).toBe('emote-3');
  });
});
