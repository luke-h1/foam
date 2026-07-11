/**
 * CSS `drop-shadow(x y r color)` and `text-shadow` blur with a Gaussian whose
 * standard deviation is half the specified radius (filter-effects-1 §9.9).
 * Skia's blur/drop-shadow image filters take the standard deviation directly,
 * so passing `radius / 2` reproduces the browser's falloff exactly.
 */
export function cssDropShadowSigma(radius: number): number {
  return radius / 2;
}
