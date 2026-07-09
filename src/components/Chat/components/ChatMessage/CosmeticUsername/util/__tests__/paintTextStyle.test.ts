import {
  NATIVE_DROP_SHADOW_RADIUS_MULTIPLIER,
  scaleNativeDropShadow,
} from '../paintTextStyle';

function rgbaToSevenTvColor(
  r: number,
  g: number,
  b: number,
  a: number,
): number {
  // eslint-disable-next-line no-bitwise
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

describe('scaleNativeDropShadow', () => {
  test('multiplies drop-shadow radius to match extension glow on native', () => {
    expect(
      scaleNativeDropShadow({
        color: rgbaToSevenTvColor(255, 0, 0, 255),
        radius: 2,
        x_offset: 1,
        y_offset: -1,
      }),
    ).toEqual({
      color: rgbaToSevenTvColor(255, 0, 0, 255),
      radius: 2 * NATIVE_DROP_SHADOW_RADIUS_MULTIPLIER,
      x_offset: 1,
      y_offset: -1,
    });
  });

  test('leaves zero-radius shadows unchanged', () => {
    const shadow = {
      color: rgbaToSevenTvColor(255, 0, 0, 255),
      radius: 0,
      x_offset: 0,
      y_offset: 0,
    };

    expect(scaleNativeDropShadow(shadow)).toEqual(shadow);
  });
});
