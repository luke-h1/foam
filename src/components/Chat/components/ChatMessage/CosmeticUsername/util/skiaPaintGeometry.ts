export interface GradientPoint {
  x: number;
  y: number;
}

export interface LinearGradientLine {
  start: GradientPoint;
  end: GradientPoint;
  length: number;
}

/**
 * CSS linear-gradient line for a box (css-images-3 §3.1.1): the line passes
 * through the box centre at `angle` (0deg = to top, clockwise positive), and
 * its length is `|W*sin(a)| + |H*cos(a)|` - the box's projection onto the
 * gradient direction - so the 0% and 100% stops land exactly where a browser
 * puts them, including on diagonal angles where the endpoints sit outside
 * the box.
 */
export function cssLinearGradientLine(
  angle: number,
  width: number,
  height: number,
): LinearGradientLine {
  const rad = (angle * Math.PI) / 180;
  const dirX = Math.sin(rad);
  const dirY = -Math.cos(rad);
  const length = Math.abs(width * dirX) + Math.abs(height * dirY);
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    start: {
      x: centerX - (dirX * length) / 2,
      y: centerY - (dirY * length) / 2,
    },
    end: {
      x: centerX + (dirX * length) / 2,
      y: centerY + (dirY * length) / 2,
    },
    length,
  };
}

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

/**
 * CSS `drop-shadow(x y r color)` and `text-shadow` blur with a Gaussian whose
 * standard deviation is half the specified radius (filter-effects-1 §9.9).
 * Skia's blur/drop-shadow image filters take the standard deviation directly,
 * so passing `radius / 2` reproduces the browser's falloff exactly.
 */
export function cssDropShadowSigma(radius: number): number {
  return radius / 2;
}

export interface LayerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Absolute-pixel form of `getLayerLayoutStyle`'s percentage maths: CSS
 * `background-position: p%` aligns the p% point of the layer with the p%
 * point of the box, i.e. offset = (box - layer) * p.
 */
export function layerRectInBox(
  at: [number, number] | null,
  size: [number, number] | null,
  width: number,
  height: number,
): LayerRect {
  const sizeX = size?.[0] ?? 1;
  const sizeY = size?.[1] ?? 1;
  const posX = at?.[0] ?? 0;
  const posY = at?.[1] ?? 0;

  return {
    x: (1 - sizeX) * posX * width,
    y: (1 - sizeY) * posY * height,
    width: sizeX * width,
    height: sizeY * height,
  };
}
