import {
  buildLayerGradientConfig,
  getLayerLayoutStyle,
  getPaintDropShadows,
  getPaintLayers,
  imageRepeatFromCanvasRepeat,
  paintShadowToTextStyle,
} from '../paintLayer';
import type {
  PaintData,
  PaintLayerData,
  PaintShadow,
} from '@app/utils/color/seventv-ws-service';

// ---------------------------------------------------------------------------
// Helpers to build minimal IndexedCollection fixtures
// ---------------------------------------------------------------------------

function makeCollection<T>(items: T[]): Record<string | number, T | number> {
  const col: Record<string | number, T | number> = { length: items.length };
  items.forEach((item, i) => {
    col[i] = item;
  });
  return col as any;
}

function makeEmptyCollection() {
  return makeCollection([]);
}

// ---------------------------------------------------------------------------
// Shared paint fixtures
// ---------------------------------------------------------------------------

/** Mimics "Winter Snowfall" — a radial gradient with image URL overlay */
const winterSnowfallPaint: PaintData = {
  id: '01WINTER0000SNOWFALL00000001',
  name: 'Winter Snowfall',
  function: 'RADIAL_GRADIENT',
  angle: 0,
  color: null,
  shape: 'circle',
  repeat: false,
  image_url: '',
  stops: makeCollection([
    { at: 0, color: -1 as any },   // white, fully opaque
    { at: 1, color: 0x87ceebff as any }, // sky blue, fully opaque
  ]),
  layers: makeCollection([
    {
      function: 'RADIAL_GRADIENT' as any,
      stops: makeCollection([
        { at: 0, color: -1 as any },
        { at: 1, color: 0x87ceebff as any },
      ]),
      angle: 0,
      shape: 'circle' as any,
      repeat: false,
      image_url: '',
      canvas_repeat: 'no-repeat' as any,
      at: null,
      size: null,
    } satisfies PaintLayerData,
    {
      function: 'URL' as any,
      stops: makeEmptyCollection() as any,
      angle: 0,
      shape: 'circle' as any,
      repeat: false,
      image_url: 'https://cdn.7tv.app/paint/snowfall/overlay.webp',
      canvas_repeat: 'repeat' as any,
      at: null,
      size: null,
    } satisfies PaintLayerData,
  ]),
  shadows: makeCollection([
    { color: 0x87ceebff as any, x_offset: 0, y_offset: 0, radius: 4 },
  ]),
  textStyle: null,
} as any;

const linearGradientPaint: PaintData = {
  id: '01NORTHERN0000LIGHT00000001',
  name: 'Northern Light',
  function: 'LINEAR_GRADIENT',
  angle: 45,
  color: null,
  shape: 'circle',
  repeat: false,
  image_url: '',
  stops: makeCollection([
    { at: 0, color: 0x9c59b6ff as any },
    { at: 1, color: 0x3498dbff as any },
  ]),
  layers: makeEmptyCollection(),
  shadows: makeCollection([
    { color: 0x00000080 as any, x_offset: 0, y_offset: 0, radius: 0.1 },
  ]),
  textStyle: null,
} as any;

const urlOnlyPaint: PaintData = {
  id: '01URLPAINT000000000000000001',
  name: 'Custom Image',
  function: 'URL',
  angle: 0,
  color: null,
  shape: 'circle',
  repeat: false,
  image_url: 'https://cdn.7tv.app/paint/custom/bg.webp',
  stops: makeEmptyCollection(),
  layers: makeEmptyCollection(),
  shadows: makeEmptyCollection(),
  textStyle: null,
} as any;

// ---------------------------------------------------------------------------
// getPaintLayers
// ---------------------------------------------------------------------------

describe('getPaintLayers', () => {
  it('returns indexed layers when the paint has layers', () => {
    const layers = getPaintLayers(winterSnowfallPaint);
    expect(layers).toHaveLength(2);
    expect(layers[0]?.function).toBe('RADIAL_GRADIENT');
    expect(layers[1]?.function).toBe('URL');
  });

  it('falls back to a synthetic layer from top-level fields when layers is empty', () => {
    const layers = getPaintLayers(linearGradientPaint);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.function).toBe('LINEAR_GRADIENT');
    expect(layers[0]?.angle).toBe(45);
  });

  it('returns empty array for a LINEAR_GRADIENT paint with no stops and null color', () => {
    const empty: PaintData = {
      ...linearGradientPaint,
      stops: makeEmptyCollection() as any,
      color: null,
      layers: makeEmptyCollection(),
    } as any;
    expect(getPaintLayers(empty)).toHaveLength(0);
  });

  it('returns a synthetic URL layer when function is URL and layers is empty', () => {
    const layers = getPaintLayers(urlOnlyPaint);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.function).toBe('URL');
    expect(layers[0]?.image_url).toBe('https://cdn.7tv.app/paint/custom/bg.webp');
  });
});

// ---------------------------------------------------------------------------
// buildLayerGradientConfig
// ---------------------------------------------------------------------------

describe('buildLayerGradientConfig', () => {
  const fallback = 'rgba(255,255,255,1.000)';

  it('returns a two-stop fallback for a URL layer', () => {
    const urlLayer = getPaintLayers(urlOnlyPaint)[0]!;
    const config = buildLayerGradientConfig(urlLayer, fallback);
    expect(config.colors).toHaveLength(2);
    expect(config.colors[0]).toBe(fallback);
    expect(config.colors[1]).toBe(fallback);
    expect(config.locations).toEqual([0, 1]);
  });

  it('returns a two-stop fallback when the layer has no stops', () => {
    const noStopLayer: PaintLayerData = {
      function: 'LINEAR_GRADIENT',
      stops: makeEmptyCollection() as any,
      angle: 90,
      shape: 'circle',
      repeat: false,
      image_url: '',
      canvas_repeat: 'no-repeat',
      at: null,
      size: null,
    };
    const config = buildLayerGradientConfig(noStopLayer, fallback);
    expect(config.colors).toHaveLength(2);
    expect(config.colors).toEqual([fallback, fallback]);
  });

  it('builds a correct gradient config for the Winter Snowfall radial layer', () => {
    const gradientLayer = getPaintLayers(winterSnowfallPaint)[0]!;
    const config = buildLayerGradientConfig(gradientLayer, fallback);
    expect(config.colors.length).toBeGreaterThanOrEqual(2);
    expect(config.locations[0]).toBe(0);
    expect(config.locations[config.locations.length - 1]).toBe(1);
  });

  it('produces start/end points from angle 0 (top to bottom)', () => {
    const layer: PaintLayerData = {
      function: 'LINEAR_GRADIENT',
      stops: makeCollection([
        { at: 0, color: 0xff0000ff as any },
        { at: 1, color: 0x0000ffff as any },
      ]) as any,
      angle: 0,
      shape: 'circle',
      repeat: false,
      image_url: '',
      canvas_repeat: 'no-repeat',
      at: null,
      size: null,
    };
    const config = buildLayerGradientConfig(layer, fallback);
    // 0deg = bottom-to-top: start.y ≈ 1, end.y ≈ 0, both x ≈ 0.5
    expect(config.start.y).toBeCloseTo(1, 5);
    expect(config.end.y).toBeCloseTo(0, 5);
    expect(config.start.x).toBeCloseTo(0.5, 5);
  });

  it('produces start/end points from angle 90 (left to right)', () => {
    const layer: PaintLayerData = {
      function: 'LINEAR_GRADIENT',
      stops: makeCollection([
        { at: 0, color: 0xff0000ff as any },
        { at: 1, color: 0x0000ffff as any },
      ]) as any,
      angle: 90,
      shape: 'circle',
      repeat: false,
      image_url: '',
      canvas_repeat: 'no-repeat',
      at: null,
      size: null,
    };
    const config = buildLayerGradientConfig(layer, fallback);
    expect(config.start.x).toBeCloseTo(0, 5);
    expect(config.end.x).toBeCloseTo(1, 5);
  });

  it('expands repeating stops to fill [0,1] range', () => {
    const layer: PaintLayerData = {
      function: 'LINEAR_GRADIENT',
      stops: makeCollection([
        { at: 0, color: 0xff0000ff as any },
        { at: 0.25, color: 0x0000ffff as any },
      ]) as any,
      angle: 0,
      shape: 'circle',
      repeat: true,
      image_url: '',
      canvas_repeat: 'repeat',
      at: null,
      size: null,
    };
    const config = buildLayerGradientConfig(layer, fallback);
    // Repeating should produce more than the original 2 stops
    expect(config.colors.length).toBeGreaterThan(2);
    expect(config.locations[config.locations.length - 1]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getPaintDropShadows
// ---------------------------------------------------------------------------

describe('getPaintDropShadows', () => {
  it('returns all shadows in mode 1 (default)', () => {
    const shadows = getPaintDropShadows(winterSnowfallPaint, 1);
    expect(shadows).toHaveLength(1);
  });

  it('returns no shadows in mode 0 (disabled)', () => {
    expect(getPaintDropShadows(winterSnowfallPaint, 0)).toHaveLength(0);
  });

  it('returns only the first shadow in mode 2', () => {
    const multiShadowPaint: PaintData = {
      ...winterSnowfallPaint,
      shadows: makeCollection([
        { color: 0x00000080 as any, x_offset: 2, y_offset: 2, radius: 4 },
        { color: 0xff000080 as any, x_offset: -2, y_offset: -2, radius: 6 },
      ]) as any,
    } as any;
    const shadows = getPaintDropShadows(multiShadowPaint, 2);
    expect(shadows).toHaveLength(1);
    expect(shadows[0]?.x_offset).toBe(2);
  });

  it('returns all shadows in mode 1 when multiple shadows exist', () => {
    const multiShadowPaint: PaintData = {
      ...winterSnowfallPaint,
      shadows: makeCollection([
        { color: 0x00000080 as any, x_offset: 1, y_offset: 1, radius: 2 },
        { color: 0x0000ff80 as any, x_offset: -1, y_offset: -1, radius: 3 },
        { color: 0xff000080 as any, x_offset: 0, y_offset: 2, radius: 5 },
      ]) as any,
    } as any;
    expect(getPaintDropShadows(multiShadowPaint, 1)).toHaveLength(3);
  });

  it('uses mode 1 by default', () => {
    const result = getPaintDropShadows(winterSnowfallPaint);
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// paintShadowToTextStyle
// ---------------------------------------------------------------------------

describe('paintShadowToTextStyle', () => {
  const shadow: PaintShadow = {
    color: 0x87ceebff as any,
    x_offset: 2,
    y_offset: -3,
    radius: 5,
  };

  it('maps x_offset to textShadowOffset.width', () => {
    const style = paintShadowToTextStyle(shadow);
    expect(style.textShadowOffset?.width).toBe(2);
  });

  it('maps y_offset to textShadowOffset.height', () => {
    const style = paintShadowToTextStyle(shadow);
    expect(style.textShadowOffset?.height).toBe(-3);
  });

  it('maps radius to textShadowRadius', () => {
    const style = paintShadowToTextStyle(shadow);
    expect(style.textShadowRadius).toBe(5);
  });

  it('produces a valid CSS color string for textShadowColor', () => {
    const style = paintShadowToTextStyle(shadow);
    expect(style.textShadowColor).toMatch(/^rgba\(/);
  });

  it('handles zero offsets and zero radius', () => {
    const zeroShadow: PaintShadow = {
      color: 0x00000000 as any,
      x_offset: 0,
      y_offset: 0,
      radius: 0,
    };
    const style = paintShadowToTextStyle(zeroShadow);
    expect(style.textShadowOffset).toEqual({ width: 0, height: 0 });
    expect(style.textShadowRadius).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getLayerLayoutStyle
// ---------------------------------------------------------------------------

describe('getLayerLayoutStyle', () => {
  it('returns absoluteFill when at and size are both null', () => {
    const layer: PaintLayerData = {
      function: 'LINEAR_GRADIENT',
      stops: makeEmptyCollection() as any,
      angle: 0,
      shape: 'circle',
      repeat: false,
      image_url: '',
      canvas_repeat: 'no-repeat',
      at: null,
      size: null,
    };
    const style = getLayerLayoutStyle(layer);
    expect(style).toMatchObject({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it('computes percentage dimensions when size is provided', () => {
    const layer: PaintLayerData = {
      function: 'URL',
      stops: makeEmptyCollection() as any,
      angle: 0,
      shape: 'circle',
      repeat: false,
      image_url: '',
      canvas_repeat: 'no-repeat',
      at: [0.5, 0.5],
      size: [0.5, 0.25],
    };
    const style = getLayerLayoutStyle(layer);
    expect(style.width).toBe('50%');
    expect(style.height).toBe('25%');
    expect(style.position).toBe('absolute');
  });

  it('uses anchor position from at when provided', () => {
    const layer: PaintLayerData = {
      function: 'URL',
      stops: makeEmptyCollection() as any,
      angle: 0,
      shape: 'circle',
      repeat: false,
      image_url: '',
      canvas_repeat: 'no-repeat',
      at: [0.25, 0.75],
      size: [1, 1],
    };
    const style = getLayerLayoutStyle(layer);
    expect(style.left).toBe('25%');
    expect(style.top).toBe('75%');
  });
});

// ---------------------------------------------------------------------------
// imageRepeatFromCanvasRepeat
// ---------------------------------------------------------------------------

describe('imageRepeatFromCanvasRepeat', () => {
  it('returns cover for no-repeat', () => {
    expect(imageRepeatFromCanvasRepeat('no-repeat', false)).toBe('cover');
  });

  it('returns cover for empty string canvas_repeat', () => {
    expect(imageRepeatFromCanvasRepeat('' as any, false)).toBe('cover');
  });

  it('returns none for repeat when layerRepeat is true', () => {
    expect(imageRepeatFromCanvasRepeat('no-repeat', true)).toBe('none');
  });

  it('returns none for canvas_repeat repeat', () => {
    expect(imageRepeatFromCanvasRepeat('repeat', false)).toBe('none');
  });

  it('returns none for canvas_repeat repeat-x', () => {
    expect(imageRepeatFromCanvasRepeat('repeat-x', false)).toBe('none');
  });

  it('returns none for canvas_repeat repeat-y', () => {
    expect(imageRepeatFromCanvasRepeat('repeat-y', false)).toBe('none');
  });

  it('returns none for canvas_repeat round', () => {
    expect(imageRepeatFromCanvasRepeat('round', false)).toBe('none');
  });

  it('returns none for canvas_repeat space', () => {
    expect(imageRepeatFromCanvasRepeat('space', false)).toBe('none');
  });

  it('returns cover for unset canvas_repeat without layer repeat', () => {
    expect(imageRepeatFromCanvasRepeat('unset', false)).toBe('cover');
  });
});
