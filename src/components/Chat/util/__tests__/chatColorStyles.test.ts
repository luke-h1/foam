import type { TextStyle } from 'react-native';

import { getChatColorStyle } from '../chatColorStyles';

describe('getChatColorStyle', () => {
  test('returns the style shape for a colour', () => {
    expect(getChatColorStyle('#9146ff')).toEqual<TextStyle>({
      color: '#9146ff',
    });
  });

  test('returns the same reference for repeat lookups of a colour', () => {
    expect(getChatColorStyle('#ff0000')).toBe(getChatColorStyle('#ff0000'));
  });

  test('clears the cache once the bound is exceeded', () => {
    const first = getChatColorStyle('#123456');
    for (let index = 0; index < 600; index += 1) {
      getChatColorStyle(`#${index.toString(16).padStart(6, '0')}`);
    }
    expect(getChatColorStyle('#123456')).not.toBe(first);
  });
});
