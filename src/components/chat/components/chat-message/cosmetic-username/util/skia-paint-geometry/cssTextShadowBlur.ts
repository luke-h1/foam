/**
 * CSS `text-shadow` blur radius to the blur Skia takes; unlike drop-shadow,
 * text-shadow keeps the box-shadow convention of half the radius.
 */
export function cssTextShadowBlur(radius: number): number {
  return radius / 2;
}
