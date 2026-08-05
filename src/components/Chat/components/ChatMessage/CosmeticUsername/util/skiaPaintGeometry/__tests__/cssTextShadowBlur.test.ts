import { cssTextShadowBlur } from '../cssTextShadowBlur';

describe('cssTextShadowBlur', () => {
  test('is half the blur radius', () => {
    expect(cssTextShadowBlur(4)).toBe(2);
    expect(cssTextShadowBlur(0)).toBe(0);
  });
});
