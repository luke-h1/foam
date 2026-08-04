import { cssDropShadowSigma } from '../cssDropShadowSigma';
import { cssTextShadowSigma } from '../cssTextShadowSigma';

describe('cssDropShadowSigma', () => {
  test('passes the blur radius through as the deviation, like Blink', () => {
    expect(cssDropShadowSigma(4)).toBe(4);
    expect(cssDropShadowSigma(0)).toBe(0);
  });
});

describe('cssTextShadowSigma', () => {
  test('is half the blur radius', () => {
    expect(cssTextShadowSigma(4)).toBe(2);
    expect(cssTextShadowSigma(0)).toBe(0);
  });
});
