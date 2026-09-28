/**
 * Passed to Skia unhalved: 7TV paints are authored against Chrome, and
 * halving made every paint shadow half as wide as the web.
 */
export function cssDropShadowBlur(radius: number): number {
  return radius;
}
