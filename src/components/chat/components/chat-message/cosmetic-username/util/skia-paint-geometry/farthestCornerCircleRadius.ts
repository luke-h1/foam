/**
 * Radius of a CSS `radial-gradient(circle, ...)` with default sizing: the
 * gradient ends at the farthest corner from the (centred) gradient centre.
 */
export function farthestCornerCircleRadius(
  width: number,
  height: number,
): number {
  return Math.hypot(width / 2, height / 2);
}
