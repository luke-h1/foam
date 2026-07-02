import { CHAT_INLINE_EMOTE_SCALE } from '../resolveEmoteScale';

describe('CHAT_INLINE_EMOTE_SCALE', () => {
  test('inline emotes request 1x as the baseline scale', () => {
    expect(CHAT_INLINE_EMOTE_SCALE).toBe('1x');
  });
});
