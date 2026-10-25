import { farthestCornerCircleRadius } from '../farthestCornerCircleRadius';

describe('farthestCornerCircleRadius', () => {
  test('is the distance from the centre to a corner', () => {
    expect(farthestCornerCircleRadius(60, 80)).toBe(50);
  });
});
