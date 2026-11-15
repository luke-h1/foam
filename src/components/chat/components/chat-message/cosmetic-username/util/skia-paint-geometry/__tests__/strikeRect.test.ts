import { type StrikeRect, strikeRect } from '../strikeRect';

describe('strikeRect', () => {
  test('centres the band on the strikeout line above the baseline', () => {
    expect(
      strikeRect({
        fontSizePx: 40,
        baselinePx: 38,
        glyphWidthPx: 120,
        originX: 4,
        originY: 6,
      }),
    ).toEqual<StrikeRect>({ x: 4, y: 30.08, width: 120, height: 2 });
  });

  test('keeps the band at least one pixel thick for a small font', () => {
    expect(
      strikeRect({
        fontSizePx: 10,
        baselinePx: 10,
        glyphWidthPx: 30,
        originX: 0,
        originY: 0,
      }).height,
    ).toBe(1);
  });
});
