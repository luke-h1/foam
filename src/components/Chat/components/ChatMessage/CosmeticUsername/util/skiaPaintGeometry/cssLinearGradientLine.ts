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
