import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintLayerData } from '@app/types/seventv/cosmetics';

import {
  buildPaintCssDeclarations,
  type PaintCssDeclarations,
  paintCssDeclarationsToBlock,
} from '../paintCss';

// Packed 7TV colors: RRGGBBAA as a signed 32-bit integer.
const RED = -16776961; // 0xFF0000FF
const BLUE = 65535; // 0x0000FFFF
const HALF_BLACK = 128; // 0x00000080

function toIndexed<T>(items: T[]): IndexedCollection<T> {
  const collection: IndexedCollection<T> = { length: items.length };
  items.forEach((item, index) => {
    collection[index] = item;
  });
  return collection;
}

function makeLayer(overrides: Partial<PaintLayerData>): PaintLayerData {
  return {
    function: 'LINEAR_GRADIENT',
    stops: { length: 0 },
    angle: 0,
    shape: 'circle',
    repeat: false,
    image_url: '',
    canvas_repeat: '',
    at: null,
    size: null,
    ...overrides,
  };
}

function makePaint(overrides: Partial<PaintData>): PaintData {
  return {
    id: 'paint-1',
    name: 'Test Paint',
    color: null,
    layers: { length: 0 },
    shadows: { length: 0 },
    textStyle: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: { length: 0 },
    ...overrides,
  };
}

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
          image_url: 'https://cdn.7tv.app/paint.webp',
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
      backgroundImage: 'url(https://cdn.7tv.app/paint.webp)',
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
});

describe('paintCssDeclarationsToBlock', () => {
  test('emits one declaration per line in the extension rule order', () => {
    const block = paintCssDeclarationsToBlock(
      buildPaintCssDeclarations(makePaint({})),
    );

    expect(block).toEqual(
      [
        'color: inherit;',
        'background-image: none;',
        'background-position: 0% 0%;',
        'background-size: auto;',
        'background-repeat: unset;',
        'filter: inherit;',
        'font-weight: inherit;',
        '-webkit-text-stroke-width: inherit;',
        '-webkit-text-stroke-color: inherit;',
        'text-shadow: unset;',
        'text-transform: unset;',
      ].join('\n'),
    );
  });
});
