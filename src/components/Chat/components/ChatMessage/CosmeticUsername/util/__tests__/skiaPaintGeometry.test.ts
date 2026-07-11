import {
  cssDropShadowSigma,
  cssLinearGradientLine,
  farthestCornerCircleRadius,
  farthestCornerEllipseRadii,
  type LayerRect,
  layerRectInBox,
} from '../skiaPaintGeometry';

describe('cssLinearGradientLine', () => {
  test('0deg runs bottom to top through the box centre', () => {
    const line = cssLinearGradientLine(0, 100, 20);

    expect(line.start.x).toBeCloseTo(50, 5);
    expect(line.start.y).toBeCloseTo(20, 5);
    expect(line.end.x).toBeCloseTo(50, 5);
    expect(line.end.y).toBeCloseTo(0, 5);
    expect(line.length).toBeCloseTo(20, 5);
  });

  test('90deg runs left to right through the box centre', () => {
    const line = cssLinearGradientLine(90, 100, 20);

    expect(line.start.x).toBeCloseTo(0, 5);
    expect(line.start.y).toBeCloseTo(10, 5);
    expect(line.end.x).toBeCloseTo(100, 5);
    expect(line.end.y).toBeCloseTo(10, 5);
    expect(line.length).toBeCloseTo(100, 5);
  });

  test('45deg on a square runs corner to corner', () => {
    const line = cssLinearGradientLine(45, 100, 100);

    expect(line.start.x).toBeCloseTo(0, 5);
    expect(line.start.y).toBeCloseTo(100, 5);
    expect(line.end.x).toBeCloseTo(100, 5);
    expect(line.end.y).toBeCloseTo(0, 5);
  });

  test('45deg on a wide box projects the box onto the gradient direction', () => {
    const line = cssLinearGradientLine(45, 100, 20);

    // |W*sin45| + |H*cos45| = (100 + 20) / sqrt(2)
    expect(line.length).toBeCloseTo(120 / Math.SQRT2, 5);
    // Endpoints sit outside the box, as in CSS.
    expect(line.start.y).toBeGreaterThan(20);
    expect(line.end.y).toBeLessThan(0);
  });
});

describe('farthestCornerCircleRadius', () => {
  test('is the distance from the centre to a corner', () => {
    expect(farthestCornerCircleRadius(60, 80)).toBe(50);
  });
});

describe('farthestCornerEllipseRadii', () => {
  test('is the farthest-side ellipse scaled by sqrt(2)', () => {
    const radii = farthestCornerEllipseRadii(100, 20);

    expect(radii.rx).toBeCloseTo(50 * Math.SQRT2, 5);
    expect(radii.ry).toBeCloseTo(10 * Math.SQRT2, 5);
  });
});

describe('cssDropShadowSigma', () => {
  test('is half the CSS blur radius', () => {
    expect(cssDropShadowSigma(4)).toBe(2);
    expect(cssDropShadowSigma(0)).toBe(0);
  });
});

describe('layerRectInBox', () => {
  test('fills the box when position and size are absent', () => {
    expect(layerRectInBox(null, null, 200, 100)).toEqual<LayerRect>({
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    });
  });

  test('offsets by (box - layer) * position like CSS background-position', () => {
    expect(layerRectInBox([0.5, 1], [0.5, 0.5], 200, 100)).toEqual<LayerRect>({
      x: 50,
      y: 50,
      width: 100,
      height: 50,
    });
  });
});
