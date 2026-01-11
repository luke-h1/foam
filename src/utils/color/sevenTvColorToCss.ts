import { sevenTvColorToRgba } from './sevenTvColorToRgba';
import { SevenTvColor } from './seventv-ws-service';

/**
 * Converts a 7TV packed RGBA color integer to a CSS-compatible rgba() string.
 *
 * The alpha channel is normalized from 0-255 to 0-1 for CSS compatibility.
 *
 * @param color - The packed RGBA color as a 32-bit signed integer.
 * @returns A CSS rgba() color string.
 *
 * @example
 * ```typescript
 * const cssColor = sevenTvColorToCss(-1675056641);
 * // Result: "rgba(156, 89, 182, 1.00)"
 * ```
 */
export function sevenTvColorToCss(color: SevenTvColor): string {
  const { r, g, b, a } = sevenTvColorToRgba(color);
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}
