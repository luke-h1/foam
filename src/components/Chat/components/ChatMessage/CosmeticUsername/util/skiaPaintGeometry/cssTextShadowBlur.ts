/**
 * CSS blur radius of `text-shadow` → the blur Skia takes. Unlike
 * `filter: drop-shadow()`, text-shadow keeps the box-shadow convention of half
 * the radius, which is what Chrome draws.
 */
export function cssTextShadowBlur(radius: number): number {
  return radius / 2;
}
