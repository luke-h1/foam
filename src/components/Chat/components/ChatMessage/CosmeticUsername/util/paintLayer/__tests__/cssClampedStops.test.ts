import { cssClampedStops } from '../cssClampedStops';

describe('cssClampedStops', () => {
  test('keeps in-order stops untouched', () => {
    const stops = [
      { at: 0, color: 1 },
      { at: 0.5, color: 2 },
      { at: 1, color: 3 },
    ];

    expect(cssClampedStops(stops)).toEqual(stops);
  });

  test('clamps out-of-order positions to the running maximum', () => {
    expect(
      cssClampedStops([
        { at: 0, color: 1 },
        { at: 0.5, color: 2 },
        { at: 0.3, color: 3 },
        { at: 0.8, color: 4 },
      ]),
    ).toEqual([
      { at: 0, color: 1 },
      { at: 0.5, color: 2 },
      { at: 0.5, color: 3 },
      { at: 0.8, color: 4 },
    ]);
  });
});
