import type { MessageStructure } from '@app/utils/chat/derive-chat-body/types';

import { getMessageStructure } from '../getMessageStructure';
import { emote, ritual, text } from './__fixtures__/deriveChatBody.fixture';

describe('getMessageStructure', () => {
  test('flags emote presence and keeps a plain emote inline', () => {
    const message = [text('nice '), emote('Kappa')];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      fitsInOneText: true,
      containsEmotes: true,
    });
  });

  test('a notice token is not inlineable', () => {
    const message = [ritual()];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      fitsInOneText: false,
      containsEmotes: false,
    });
  });

  test('returns the cached reference for the same tokens array', () => {
    const message = [text('cached')];

    expect(getMessageStructure(message)).toBe(getMessageStructure(message));
  });
});
