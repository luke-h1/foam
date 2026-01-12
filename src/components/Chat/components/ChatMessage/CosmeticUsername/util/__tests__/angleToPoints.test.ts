import { angleToPoints } from '../angleToPoints';

describe('angleToPoints', () => {
  describe('Standard angles', () => {
    test('0deg should go from bottom to top', () => {
      const result = angleToPoints(0);
      // 0deg = bottom to top
      // Start should be at bottom (y ≈ 1), end at top (y ≈ 0)
      expect(result.start.y).toBeCloseTo(1, 5);
      expect(result.end.y).toBeCloseTo(0, 5);
      // Both should be centered horizontally
      expect(result.start.x).toBeCloseTo(0.5, 5);
      expect(result.end.x).toBeCloseTo(0.5, 5);
    });

    test('90deg should go from left to right', () => {
      const result = angleToPoints(90);
      // 90deg = left to right
      // Start should be at left (x ≈ 0), end at right (x ≈ 1)
      expect(result.start.x).toBeCloseTo(0, 5);
      expect(result.end.x).toBeCloseTo(1, 5);
      // Both should be centered vertically
      expect(result.start.y).toBeCloseTo(0.5, 5);
      expect(result.end.y).toBeCloseTo(0.5, 5);
    });

    test('180deg should go from top to bottom', () => {
      const result = angleToPoints(180);
      // 180deg = top to bottom
      // Start should be at top (y ≈ 0), end at bottom (y ≈ 1)
      expect(result.start.y).toBeCloseTo(0, 5);
      expect(result.end.y).toBeCloseTo(1, 5);
      // Both should be centered horizontally
      expect(result.start.x).toBeCloseTo(0.5, 5);
      expect(result.end.x).toBeCloseTo(0.5, 5);
    });

    test('270deg should go from right to left', () => {
      const result = angleToPoints(270);
      // 270deg = right to left
      // Start should be at right (x ≈ 1), end at left (x ≈ 0)
      expect(result.start.x).toBeCloseTo(1, 5);
      expect(result.end.x).toBeCloseTo(0, 5);
      // Both should be centered vertically
      expect(result.start.y).toBeCloseTo(0.5, 5);
      expect(result.end.y).toBeCloseTo(0.5, 5);
    });
  });

  describe('Diagonal angles', () => {
    test('45deg should go from bottom-left to top-right', () => {
      const result = angleToPoints(45);
      // 45deg = bottom-left to top-right
      expect(result.start.x).toBeLessThan(0.5);
      expect(result.start.y).toBeGreaterThan(0.5);
      expect(result.end.x).toBeGreaterThan(0.5);
      expect(result.end.y).toBeLessThan(0.5);
    });

    test('135deg should go from top-left to bottom-right', () => {
      const result = angleToPoints(135);
      // 135deg = top-left to bottom-right
      expect(result.start.x).toBeLessThan(0.5);
      expect(result.start.y).toBeLessThan(0.5);
      expect(result.end.x).toBeGreaterThan(0.5);
      expect(result.end.y).toBeGreaterThan(0.5);
    });

    test('225deg should go from top-right to bottom-left', () => {
      const result = angleToPoints(225);
      // 225deg = top-right to bottom-left
      expect(result.start.x).toBeGreaterThan(0.5);
      expect(result.start.y).toBeLessThan(0.5);
      expect(result.end.x).toBeLessThan(0.5);
      expect(result.end.y).toBeGreaterThan(0.5);
    });

    test('315deg should go from bottom-right to top-left', () => {
      const result = angleToPoints(315);
      // 315deg = bottom-right to top-left
      expect(result.start.x).toBeGreaterThan(0.5);
      expect(result.start.y).toBeGreaterThan(0.5);
      expect(result.end.x).toBeLessThan(0.5);
      expect(result.end.y).toBeLessThan(0.5);
    });
  });

  describe('Coordinates', () => {
    test('all coordinates should be in valid range [0, 1]', () => {
      const angles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      angles.forEach(angle => {
        const result = angleToPoints(angle);
        expect(result.start.x).toBeGreaterThanOrEqual(0);
        expect(result.start.x).toBeLessThanOrEqual(1);
        expect(result.start.y).toBeGreaterThanOrEqual(0);
        expect(result.start.y).toBeLessThanOrEqual(1);
        expect(result.end.x).toBeGreaterThanOrEqual(0);
        expect(result.end.x).toBeLessThanOrEqual(1);
        expect(result.end.y).toBeGreaterThanOrEqual(0);
        expect(result.end.y).toBeLessThanOrEqual(1);
      });
    });

    test('start and end points should be different', () => {
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      angles.forEach(angle => {
        const result = angleToPoints(angle);
        expect(
          result.start.x !== result.end.x || result.start.y !== result.end.y,
        ).toBe(true);
      });
    });
  });
});
