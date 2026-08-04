import type { PaintShadow } from '@app/types/seventv/cosmetics';

import { paintShadowExtents, type ShadowExtents } from '../paintShadowExtents';

const shadow = (overrides: Partial<PaintShadow> = {}): PaintShadow => ({
  color: 0xff0000ff,
  radius: 0,
  x_offset: 0,
  y_offset: 0,
  ...overrides,
});

describe('paintShadowExtents', () => {
  test('falls back to the stroke width with no shadows', () => {
    expect(paintShadowExtents([], [], 2)).toEqual<ShadowExtents>({
      left: 2,
      top: 2,
      right: 2,
      bottom: 2,
    });
  });

  test('reaches three blur widths past a single drop shadow, offset included', () => {
    expect(
      paintShadowExtents([shadow({ radius: 4, x_offset: 2 })], [], 0),
    ).toEqual<ShadowExtents>({
      left: 10,
      top: 12,
      right: 14,
      bottom: 12,
    });
  });

  test('adds chained drop shadow blurs as squares, not by summing radii', () => {
    const chain = Array.from({ length: 8 }, () => shadow({ radius: 1 }));
    // 3 * sqrt(8 * 1^2) = 8.49px out; summing the radii would have given 24.
    const reach = 3 * Math.sqrt(8);

    expect(paintShadowExtents(chain, [], 0)).toEqual<ShadowExtents>({
      left: reach,
      top: reach,
      right: reach,
      bottom: reach,
    });
  });

  test('carries the running offset through a chain', () => {
    // Each shadow lands 3px further right than the last, so the second sits at
    // 6 and its blur reaches past that; nothing reaches back past the glyph.
    const reach = 3 * Math.SQRT2;

    expect(
      paintShadowExtents(
        [
          shadow({ radius: 1, x_offset: 3 }),
          shadow({ radius: 1, x_offset: 3 }),
        ],
        [],
        0,
      ),
    ).toEqual<ShadowExtents>({
      left: 0,
      top: reach,
      right: 6 + reach,
      bottom: reach,
    });
  });

  test('sizes text shadows independently of each other', () => {
    const extents = paintShadowExtents(
      [],
      [shadow({ radius: 4 }), shadow({ radius: 4 })],
      0,
    );

    // text-shadow blurs at half the radius, and the two do not compound.
    expect(extents).toEqual<ShadowExtents>({
      left: 6,
      top: 6,
      right: 6,
      bottom: 6,
    });
  });
});
