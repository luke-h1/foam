// "shape" is the 7TV paint API field (types/seventv/cosmetics.ts), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import type { PaintLayerData } from '@app/types/seventv/cosmetics';

import { isRenderablePaintLayer } from '../isRenderablePaintLayer';

function createLayer(overrides: Partial<PaintLayerData>): PaintLayerData {
  return {
    function: 'LINEAR_GRADIENT',
    image_url: '',
    stops: { length: 0 },
    angle: 0,
    shape: 'circle',
    repeat: false,
    canvas_repeat: '',
    at: null,
    size: null,
    opacity: 1,
    ...overrides,
  };
}

const TWO_STOPS = {
  0: { at: 0, color: 0xff0000ff },
  1: { at: 1, color: 0x0000ffff },
  length: 2,
};

describe('isRenderablePaintLayer', () => {
  test('gradient with stops renders; zero-stop gradient does not', () => {
    expect(isRenderablePaintLayer(createLayer({ stops: TWO_STOPS }))).toBe(
      true,
    );
    expect(isRenderablePaintLayer(createLayer({}))).toBe(false);
  });

  test('url layer needs an image url', () => {
    expect(
      isRenderablePaintLayer(
        createLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        }),
      ),
    ).toBe(true);
    expect(isRenderablePaintLayer(createLayer({ function: 'URL' }))).toBe(
      false,
    );
  });

  test('fully transparent layers never render', () => {
    expect(
      isRenderablePaintLayer(createLayer({ stops: TWO_STOPS, opacity: 0 })),
    ).toBe(false);
    expect(
      isRenderablePaintLayer(
        createLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
          opacity: 0,
        }),
      ),
    ).toBe(false);
  });
});
