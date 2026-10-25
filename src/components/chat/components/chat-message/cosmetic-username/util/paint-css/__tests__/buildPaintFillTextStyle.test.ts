import {
  BLUE,
  makeLayer,
  makePaint,
  RED,
  toIndexed,
} from '../__fixtures__/paintCss.fixture';
import type { PaintFillTextStyle } from '../buildPaintFillTextStyle';
import { buildPaintFillTextStyle } from '../buildPaintFillTextStyle';

describe('buildPaintFillTextStyle', () => {
  test('clips a gradient to the glyphs and keeps the fallback when the paint has no colour', () => {
    const paint = makePaint({
      layers: toIndexed([
        makeLayer({
          function: 'LINEAR_GRADIENT',
          angle: 90,
          stops: toIndexed([
            { at: 1, color: BLUE },
            { at: 0, color: RED },
          ]),
        }),
      ]),
    });

    expect(
      buildPaintFillTextStyle(paint, '#9146FF'),
    ).toEqual<PaintFillTextStyle>({
      backgroundClip: 'text',
      backgroundColor: 'currentcolor',
      backgroundImage:
        'linear-gradient(90deg, rgba(0, 0, 255, 1.000) 100%, rgba(255, 0, 0, 1.000) 0%)',
      backgroundPosition: '0% 0%',
      backgroundRepeat: 'unset',
      backgroundSize: 'auto',
      color: '#9146FF',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    });
  });

  test('uses a solid colour when the paint has no layer to clip', () => {
    expect(
      buildPaintFillTextStyle(makePaint({}), '#9146FF'),
    ).toEqual<PaintFillTextStyle>({
      color: '#9146FF',
    });
  });
});
