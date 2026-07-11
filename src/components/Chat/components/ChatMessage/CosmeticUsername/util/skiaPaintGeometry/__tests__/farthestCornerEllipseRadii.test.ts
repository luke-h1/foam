import { farthestCornerEllipseRadii } from '../farthestCornerEllipseRadii';

describe('farthestCornerEllipseRadii', () => {
  test('is the farthest-side ellipse scaled by sqrt(2)', () => {
    const radii = farthestCornerEllipseRadii(100, 20);

    expect(radii.rx).toBeCloseTo(50 * Math.SQRT2, 5);
    expect(radii.ry).toBeCloseTo(10 * Math.SQRT2, 5);
  });
});
