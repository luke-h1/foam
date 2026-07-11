import { cssDropShadowSigma } from '../cssDropShadowSigma';

describe('cssDropShadowSigma', () => {
  test('is half the CSS blur radius', () => {
    expect(cssDropShadowSigma(4)).toBe(2);
    expect(cssDropShadowSigma(0)).toBe(0);
  });
});
