import { CHAT_INLINE_EMOTE_SCALE } from '../resolve-emote-scale';

describe('CHAT_INLINE_EMOTE_SCALE', () => {
  test('inline emotes request 2x as the baseline scale', () => {
    expect(CHAT_INLINE_EMOTE_SCALE).toBe('2x');
  });
});
