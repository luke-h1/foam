import type { PaintData } from '@app/types/seventv/cosmetics';

import { serializeNativePaintDefinition } from '@modules/painted-username/src/serializeNativePaintDefinition';

function rgbaToSevenTvColor(
  r: number,
  g: number,
  b: number,
  a: number,
): number {
  // eslint-disable-next-line no-bitwise
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

const gradientPaint: PaintData = {
  id: 'gradient-paint',
  name: 'Gradient',
  color: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 45,
  shape: 'circle',
  image_url: '',
  layers: { length: 0 },
  stops: {
    0: { color: rgbaToSevenTvColor(255, 0, 0, 255), at: 0 },
    1: { color: rgbaToSevenTvColor(0, 0, 255, 255), at: 1 },
    length: 2,
  },
  textStyle: null,
  shadows: {
    0: {
      color: rgbaToSevenTvColor(255, 191, 0, 255),
      radius: 4,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
};

describe('serializeNativePaintDefinition', () => {
  test('serializes layers, drop shadows, and text stroke for native rendering', () => {
    const paint: PaintData = {
      ...gradientPaint,
      textStyle: {
        weight: 7,
        transform: 'uppercase',
        stroke: {
          color: rgbaToSevenTvColor(255, 255, 255, 255),
          width: 1,
        },
        shadows: {
          0: {
            color: rgbaToSevenTvColor(0, 0, 0, 128),
            radius: 2,
            x_offset: 1,
            y_offset: -1,
          },
          length: 1,
        },
      },
    };

    expect(serializeNativePaintDefinition(paint, 1)).toEqual({
      color: null,
      layers: [
        {
          function: 'LINEAR_GRADIENT',
          stops: [
            { color: rgbaToSevenTvColor(255, 0, 0, 255), at: 0 },
            { color: rgbaToSevenTvColor(0, 0, 255, 255), at: 1 },
          ],
          angle: 45,
          shape: 'circle',
          repeat: false,
          image_url: '',
          canvas_repeat: 'unset',
          at: null,
          size: null,
          opacity: 1,
        },
      ],
      dropShadows: [
        {
          color: rgbaToSevenTvColor(255, 191, 0, 255),
          radius: 4,
          x_offset: 0,
          y_offset: 0,
        },
      ],
      textStyle: {
        weight: 7,
        transform: 'uppercase',
        stroke: {
          color: rgbaToSevenTvColor(255, 255, 255, 255),
          width: 1,
        },
        shadows: [
          {
            color: rgbaToSevenTvColor(0, 0, 0, 128),
            radius: 2,
            x_offset: 1,
            y_offset: -1,
          },
        ],
      },
    });
  });

  test('honours drop shadow mode 2 by keeping only the first shadow', () => {
    expect(serializeNativePaintDefinition(gradientPaint, 2)).toEqual({
      color: null,
      layers: [
        {
          function: 'LINEAR_GRADIENT',
          stops: [
            { color: rgbaToSevenTvColor(255, 0, 0, 255), at: 0 },
            { color: rgbaToSevenTvColor(0, 0, 255, 255), at: 1 },
          ],
          angle: 45,
          shape: 'circle',
          repeat: false,
          image_url: '',
          canvas_repeat: 'unset',
          at: null,
          size: null,
          opacity: 1,
        },
      ],
      dropShadows: [
        {
          color: rgbaToSevenTvColor(255, 191, 0, 255),
          radius: 4,
          x_offset: 0,
          y_offset: 0,
        },
      ],
      textStyle: null,
    });
  });
});
