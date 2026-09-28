import { farthestCornerCircleRadius } from '../farthest-corner-circle-radius';

describe('farthestCornerCircleRadius', () => {
  test('is the distance from the centre to a corner', () => {
    expect(farthestCornerCircleRadius(60, 80)).toBe(50);
  });
});
