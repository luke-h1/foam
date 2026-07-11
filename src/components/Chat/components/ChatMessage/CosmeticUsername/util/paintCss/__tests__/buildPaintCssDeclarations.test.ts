import { buildPaintCssDeclarations } from '../buildPaintCssDeclarations';
import type { PaintCssDeclarations } from '../types';
import {
  BLUE,
  HALF_BLACK,
  makeLayer,
  makePaint,
  RED,
  toIndexed,
} from './__fixtures__/paintCss.fixture';

describe('buildPaintCssDeclarations', () => {
  test('linear gradient layer with a drop shadow', () => {
    const paint = makePaint({
      layers: toIndexed([
        makeLayer({
          function: 'LINEAR_GRADIENT',
          angle: 90,
          // Out of order on purpose: stops must be sorted by position.
          stops: toIndexed([
            { at: 1, color: BLUE },
            { at: 0, color: RED },
          ]),
        }),
      ]),
      shadows: toIndexed([
        { x_offset: 1, y_offset: 2, radius: 4, color: HALF_BLACK },
      ]),
    });

    expect(buildPaintCssDeclarations(paint)).toEqual<PaintCssDeclarations>({
      color: 'inherit',
      backgroundImage:
        'linear-gradient(90deg, rgba(255, 0, 0, 1.000) 0%, rgba(0, 0, 255, 1.000) 100%)',
      backgroundPosition: '0% 0%',
      backgroundSize: 'auto',
      backgroundRepeat: 'unset',
      filter: 'drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.502))',
      fontWeight: 'inherit',
      webkitTextStrokeWidth: 'inherit',
      webkitTextStrokeColor: 'inherit',
      textShadow: 'unset',
      textTransform: 'unset',
    });
  });

  test('repeating radial layer with position, size, and base color', () => {
    const paint = makePaint({
      color: BLUE,
      layers: toIndexed([
        makeLayer({
          function: 'RADIAL_GRADIENT',
          shape: 'ellipse',
          repeat: true,
          stops: toIndexed([
            { at: 0.25, color: RED },
            { at: 0.5, color: BLUE },
          ]),
          at: [0.5, 0.5],
          size: [0.5, 0.25],
          canvas_repeat: 'no-repeat',
        }),
      ]),
    });

    expect(buildPaintCssDeclarations(paint)).toEqual<PaintCssDeclarations>({
      color: 'rgba(0, 0, 255, 1.000)',
      backgroundImage:
        'repeating-radial-gradient(ellipse, rgba(255, 0, 0, 1.000) 25%, rgba(0, 0, 255, 1.000) 50%)',
      backgroundPosition: '50% 50%',
      backgroundSize: '50% 25%',
      backgroundRepeat: 'no-repeat',
      filter: 'inherit',
      fontWeight: 'inherit',
      webkitTextStrokeWidth: 'inherit',
      webkitTextStrokeColor: 'inherit',
      textShadow: 'unset',
      textTransform: 'unset',
    });
  });

  test('image layer with text styles and stacked drop shadows', () => {
    const paint = makePaint({
      layers: toIndexed([
        makeLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.webp',
          size: [1, 1],
          canvas_repeat: 'no-repeat',
        }),
      ]),
      shadows: toIndexed([
        { x_offset: 1, y_offset: 1, radius: 2, color: RED },
        { x_offset: -1, y_offset: -1, radius: 2, color: BLUE },
      ]),
      textStyle: {
        weight: 7,
        transform: 'uppercase',
        stroke: { color: RED, width: 2 },
        shadows: toIndexed([
          { x_offset: 0, y_offset: 1, radius: 2, color: HALF_BLACK },
        ]),
      },
    });

    expect(buildPaintCssDeclarations(paint)).toEqual<PaintCssDeclarations>({
      color: 'inherit',
      backgroundImage:
        'url(https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif)',
      backgroundPosition: '0% 0%',
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      filter:
        'drop-shadow(1px 1px 2px rgba(255, 0, 0, 1.000)) drop-shadow(-1px -1px 2px rgba(0, 0, 255, 1.000))',
      fontWeight: '700',
      webkitTextStrokeWidth: '2px',
      webkitTextStrokeColor: 'rgba(255, 0, 0, 1.000)',
      textShadow: '0px 1px 2px rgba(0, 0, 0, 0.502)',
      textTransform: 'uppercase',
    });
  });

  test('paint with no layers and no color falls back to CSS initial values', () => {
    expect(
      buildPaintCssDeclarations(makePaint({})),
    ).toEqual<PaintCssDeclarations>({
      color: 'inherit',
      backgroundImage: 'none',
      backgroundPosition: '0% 0%',
      backgroundSize: 'auto',
      backgroundRepeat: 'unset',
      filter: 'inherit',
      fontWeight: 'inherit',
      webkitTextStrokeWidth: 'inherit',
      webkitTextStrokeColor: 'inherit',
      textShadow: 'unset',
      textTransform: 'unset',
    });
  });

  test('URL layer with empty image_url emits none instead of invalid url()', () => {
    const paint = makePaint({
      layers: toIndexed([
        makeLayer({
          function: 'LINEAR_GRADIENT',
          angle: 90,
          stops: toIndexed([
            { at: 0, color: RED },
            { at: 1, color: BLUE },
          ]),
        }),
        makeLayer({
          function: 'URL',
          image_url: '',
        }),
      ]),
    });

    expect(buildPaintCssDeclarations(paint)).toEqual<PaintCssDeclarations>({
      color: 'inherit',
      backgroundImage:
        'linear-gradient(90deg, rgba(255, 0, 0, 1.000) 0%, rgba(0, 0, 255, 1.000) 100%), none',
      backgroundPosition: '0% 0%, 0% 0%',
      backgroundSize: 'auto, auto',
      backgroundRepeat: 'unset, unset',
      filter: 'inherit',
      fontWeight: 'inherit',
      webkitTextStrokeWidth: 'inherit',
      webkitTextStrokeColor: 'inherit',
      textShadow: 'unset',
      textTransform: 'unset',
    });
  });
});
