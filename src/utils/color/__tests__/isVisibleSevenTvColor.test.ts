import { isVisibleSevenTvColor } from '../isVisibleSevenTvColor';

describe('isVisibleSevenTvColor', () => {
  test('accepts an opaque colour', () => {
    expect(isVisibleSevenTvColor(0x9c_28_a9_ff)).toBe(true);
  });

  test('accepts a partially transparent colour', () => {
    expect(isVisibleSevenTvColor(0x9c_28_a9_01)).toBe(true);
  });

  test('rejects a fully transparent colour, which would draw nothing', () => {
    expect(isVisibleSevenTvColor(0x9c_28_a9_00)).toBe(false);
  });

  test('rejects an absent colour', () => {
    expect(isVisibleSevenTvColor(null)).toBe(false);

    expect(isVisibleSevenTvColor(undefined)).toBe(false);
  });
});
