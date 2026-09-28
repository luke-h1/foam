export type EllipseRadii = {
  rx: number;
  ry: number;
};

/**
 * For a centred gradient the farthest-corner ellipse is the farthest-side
 * ellipse scaled by sqrt(2) so it passes the corner (css-images-3 §3.2.3).
 */
export function farthestCornerEllipseRadii(
  width: number,
  height: number,
): EllipseRadii {
  return {
    rx: (width / 2) * Math.SQRT2,
    ry: (height / 2) * Math.SQRT2,
  };
}
