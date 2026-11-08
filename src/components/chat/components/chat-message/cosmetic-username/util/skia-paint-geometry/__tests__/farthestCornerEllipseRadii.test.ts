import { farthestCornerEllipseRadii } from '../farthestCornerEllipseRadii';

describe('farthestCornerEllipseRadii', () => {
  test('scales the farthest-side ellipse so it passes through the corner', () => {
    const radii = farthestCornerEllipseRadii(100, 20);

    expect(radii.rx).toBeCloseTo(70.71068, 5);

    expect(radii.ry).toBeCloseTo(14.14214, 5);
  });
});
