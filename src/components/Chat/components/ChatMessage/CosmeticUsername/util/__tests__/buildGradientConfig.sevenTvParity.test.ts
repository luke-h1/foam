import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { buildGradientConfig } from '../buildGradientConfig';

function rgbaToSevenTvColor(
  r: number,
  g: number,
  b: number,
  a: number,
): number {
  // eslint-disable-next-line no-bitwise
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

const createPaintData = (overrides: Partial<PaintData> = {}): PaintData => ({
  id: 'paint-1',
  name: 'Test Paint',
  color: null,
  gradients: { length: 0 },
  shadows: { length: 0 },
  text: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 90,
  shape: 'circle',
  image_url: '',
  stops: { length: 0 },
  ...overrides,
});

describe('buildGradientConfig (7TV parity fixtures)', () => {
  const fallbackColor = '#FFFFFF';

  test('rose gold fixture keeps stop order/locations and left->right angle behavior', () => {
    const roseGold = createPaintData({
      angle: 90,
      stops: {
        0: { at: 0, color: rgbaToSevenTvColor(254, 118, 148, 255) },
        1: { at: 0.5, color: rgbaToSevenTvColor(255, 200, 180, 255) },
        2: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) },
        length: 3,
      },
    });

    const config = buildGradientConfig(roseGold, fallbackColor);
    expect(config.colors).toEqual(['#fe7694ff', '#ffc8b4ff', '#ff4d73ff']);
    expect(config.locations).toEqual([0, 0.5, 1]);
    expect(config.start.x).toBeCloseTo(0, 5);
    expect(config.start.y).toBeCloseTo(0.5, 5);
    expect(config.end.x).toBeCloseTo(1, 5);
    expect(config.end.y).toBeCloseTo(0.5, 5);
  });

  test('radial fixture still returns mapped stop colors/locations for radial renderer', () => {
    const flowerchild = createPaintData({
      function: 'RADIAL_GRADIENT',
      stops: {
        0: { at: 0, color: rgbaToSevenTvColor(100, 200, 220, 255) },
        1: { at: 0.5, color: rgbaToSevenTvColor(0, 150, 180, 255) },
        2: { at: 1, color: rgbaToSevenTvColor(0, 96, 128, 255) },
        length: 3,
      },
    });

    const config = buildGradientConfig(flowerchild, fallbackColor);
    expect(config.colors).toEqual(['#64c8dcff', '#0096b4ff', '#006080ff']);
    expect(config.locations).toEqual([0, 0.5, 1]);
  });

  test('unsorted stops are normalized to ascending at-values', () => {
    const unsorted = createPaintData({
      angle: 0,
      stops: {
        0: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) },
        1: { at: 0, color: rgbaToSevenTvColor(254, 118, 148, 255) },
        2: { at: 0.5, color: rgbaToSevenTvColor(255, 200, 180, 255) },
        length: 3,
      },
    });

    const config = buildGradientConfig(unsorted, fallbackColor);
    expect(config.locations).toEqual([0, 0.5, 1]);
    expect(config.colors).toEqual(['#fe7694ff', '#ffc8b4ff', '#ff4d73ff']);
    expect(config.start.x).toBeCloseTo(0.5, 5);
    expect(config.start.y).toBeCloseTo(1, 5);
    expect(config.end.x).toBeCloseTo(0.5, 5);
    expect(config.end.y).toBeCloseTo(0, 5);
  });

  test('URL paints still resolve to a deterministic solid fallback in gradient config', () => {
    const assetPaint = createPaintData({
      function: 'URL',
      color: rgbaToSevenTvColor(194, 168, 0, 255),
      image_url: 'https://cdn.7tv.app/paint/test/4x.webp',
    });

    const config = buildGradientConfig(assetPaint, fallbackColor);
    expect(config.colors).toEqual(['#c2a800ff', '#c2a800ff']);
    expect(config.locations).toEqual([0, 1]);
  });
});
