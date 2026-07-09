import type { PaintData } from '@app/types/seventv/cosmetics';

import {
  buildPaintCssInlineStyle,
  buildPaintCssTextStyle,
  type PaintCssTextStyle,
} from '../buildPaintCssStyle';

function rgbaToSevenTvColor(
  r: number,
  g: number,
  b: number,
  a: number,
): number {
  // eslint-disable-next-line no-bitwise
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

const roseGoldPaint: PaintData = {
  id: 'rose-gold',
  name: 'Rose Gold',
  color: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 0,
  shape: 'circle',
  image_url: '',
  layers: {
    0: {
      function: 'LINEAR_GRADIENT',
      angle: 0,
      repeat: false,
      shape: 'circle',
      image_url: '',
      canvas_repeat: 'unset',
      at: null,
      size: null,
      stops: {
        0: { at: 0, color: rgbaToSevenTvColor(255, 97, 129, 255) },
        1: { at: 0.4, color: rgbaToSevenTvColor(254, 155, 144, 255) },
        2: { at: 1, color: rgbaToSevenTvColor(255, 117, 147, 255) },
        length: 3,
      },
    },
    length: 1,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(254, 118, 148, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    1: {
      color: rgbaToSevenTvColor(255, 77, 115, 255),
      radius: 4,
      x_offset: 0,
      y_offset: 0,
    },
    length: 2,
  },
  textStyle: {
    stroke: {
      color: rgbaToSevenTvColor(255, 255, 255, 255),
      width: 1,
    },
  },
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(255, 97, 129, 255) },
    1: { at: 1, color: rgbaToSevenTvColor(255, 117, 147, 255) },
    length: 2,
  },
};

describe('buildPaintCssTextStyle', () => {
  test('clips gradient backgrounds to text and stacks drop-shadow filters', () => {
    expect(buildPaintCssTextStyle(roseGoldPaint, '#ffffff', 1)).toEqual<PaintCssTextStyle>({
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundColor: 'currentColor',
      color: 'inherit',
      fontWeight: '700',
      backgroundImage:
        'linear-gradient(0deg, rgba(255, 97, 129, 1.000) 0%, rgba(254, 155, 144, 1.000) 40%, rgba(255, 117, 147, 1.000) 100%)',
      backgroundPosition: '',
      backgroundSize: '',
      backgroundRepeat: 'unset',
      filter:
        'drop-shadow(0px 0px 0.1px rgba(254, 118, 148, 1.000)) drop-shadow(0px 0px 4px rgba(255, 77, 115, 1.000))',
      WebkitTextStrokeWidth: '1px',
      WebkitTextStrokeColor: 'rgba(255, 255, 255, 1.000)',
    });
  });

  test('limits drop-shadow filters when mode is 2', () => {
    expect(buildPaintCssTextStyle(roseGoldPaint, '#ffffff', 2).filter).toBe(
      'drop-shadow(0px 0px 0.1px rgba(254, 118, 148, 1.000))',
    );
  });

  test('omits drop-shadow filters when mode is 0', () => {
    const style = buildPaintCssTextStyle(roseGoldPaint, '#ffffff', 0);
    expect('filter' in style).toBe(false);
  });
});

describe('buildPaintCssInlineStyle', () => {
  test('serializes extension-style paint CSS for inline HTML', () => {
    expect(buildPaintCssInlineStyle(roseGoldPaint, '#ffffff', 1)).toEqual(
      'background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; color: inherit; background-color: currentColor; background-image: linear-gradient(0deg, rgba(255, 97, 129, 1.000) 0%, rgba(254, 155, 144, 1.000) 40%, rgba(255, 117, 147, 1.000) 100%); background-repeat: unset; filter: drop-shadow(0px 0px 0.1px rgba(254, 118, 148, 1.000)) drop-shadow(0px 0px 4px rgba(255, 77, 115, 1.000)); -webkit-text-stroke-width: 1px; -webkit-text-stroke-color: rgba(255, 255, 255, 1.000)',
    );
  });
});
