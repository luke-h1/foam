/**
 * Calculate gradient start and end points based on angle
 * CSS gradient angles: 0deg = bottom to top, 90deg = left to right
 * We convert to expo-linear-gradient's coordinate system
 */
export function angleToPoints(angle: number): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  // Convert CSS angle to radians
  // CSS: 0deg = bottom to top, clockwise positive
  // We need to convert to coordinate points where (0,0) is top-left
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
