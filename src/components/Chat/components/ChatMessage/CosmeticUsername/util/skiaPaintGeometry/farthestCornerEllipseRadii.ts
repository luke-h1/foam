/**
 * Radii of a CSS `radial-gradient(ellipse, ...)` with default sizing. For a
 * centred gradient the farthest-corner ellipse is the farthest-side ellipse
 * scaled by sqrt(2) so it passes through the corner (css-images-3 §3.2.3).
 */
export function farthestCornerEllipseRadii(
  width: number,
  height: number,
): { rx: number; ry: number } {
  return {
    rx: (width / 2) * Math.SQRT2,
    ry: (height / 2) * Math.SQRT2,
  };
}
