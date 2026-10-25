type GradientPoints = {
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/**
 * CSS gradient angle (0deg = bottom to top, clockwise) to
 * expo-linear-gradient start/end points, where (0,0) is top-left.
 */
export function angleToPoints(angle: number): GradientPoints {
  const rad = ((angle - 90) * Math.PI) / 180;

  const x1 = 0.5 + 0.5 * Math.cos(rad + Math.PI);
  const y1 = 0.5 + 0.5 * Math.sin(rad + Math.PI);
  const x2 = 0.5 + 0.5 * Math.cos(rad);
  const y2 = 0.5 + 0.5 * Math.sin(rad);

  return {
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
  };
}
