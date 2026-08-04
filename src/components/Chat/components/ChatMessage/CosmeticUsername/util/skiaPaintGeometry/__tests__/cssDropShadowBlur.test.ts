import { cssDropShadowBlur } from '../cssDropShadowBlur';

describe('cssDropShadowBlur', () => {
  test('passes the blur radius through, like Blink', () => {
    expect(cssDropShadowBlur(4)).toBe(4);
    expect(cssDropShadowBlur(0)).toBe(0);
  });
});
