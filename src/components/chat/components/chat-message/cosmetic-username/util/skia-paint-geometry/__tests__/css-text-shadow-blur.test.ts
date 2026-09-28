import { cssTextShadowBlur } from '../css-text-shadow-blur';

describe('cssTextShadowBlur', () => {
  test('is half the blur radius', () => {
    expect(cssTextShadowBlur(4)).toBe(2);
    expect(cssTextShadowBlur(0)).toBe(0);
  });
});
