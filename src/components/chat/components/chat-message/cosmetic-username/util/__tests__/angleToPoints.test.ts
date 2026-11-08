import { angleToPoints } from '../angleToPoints';

interface GradientPoints {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

const roundPoint = ({ x, y }: { x: number; y: number }) => ({
  x: Number(x.toFixed(5)) + 0,
  y: Number(y.toFixed(5)) + 0,
});

describe('angleToPoints', () => {
  test.each<[string, number, GradientPoints]>([
    ['bottom to top', 0, { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } }],
    ['left to right', 90, { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } }],
    ['top to bottom', 180, { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }],
    ['right to left', 270, { start: { x: 1, y: 0.5 }, end: { x: 0, y: 0.5 } }],
    [
      'bottom-left to top-right',
      45,
      { start: { x: 0.14645, y: 0.85355 }, end: { x: 0.85355, y: 0.14645 } },
    ],
    [
      'top-left to bottom-right',
      135,
      { start: { x: 0.14645, y: 0.14645 }, end: { x: 0.85355, y: 0.85355 } },
    ],
    [
      'top-right to bottom-left',
      225,
      { start: { x: 0.85355, y: 0.14645 }, end: { x: 0.14645, y: 0.85355 } },
    ],
    [
      'bottom-right to top-left',
      315,
      { start: { x: 0.85355, y: 0.85355 }, end: { x: 0.14645, y: 0.14645 } },
    ],
  ])('runs %s at %ddeg', (_label, angle, expected) => {
    const { start, end } = angleToPoints(angle);

    expect({ start: roundPoint(start), end: roundPoint(end) }).toEqual(
      expected,
    );
  });
});
