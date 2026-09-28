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
 * CSS linear-gradient line for a box (css-images-3 §3.1.1), so the 0%/100%
 * stops land where a browser puts them, even at diagonal angles.
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
