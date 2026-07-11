import { cssLinearGradientLine } from '../cssLinearGradientLine';

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
