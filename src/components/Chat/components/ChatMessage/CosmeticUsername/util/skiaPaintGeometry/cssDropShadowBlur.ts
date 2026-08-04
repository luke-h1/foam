/**
 * CSS blur radius of `filter: drop-shadow()` → the blur Skia takes.
 *
 * filter-effects-1 reads as though the radius is twice the blur, but Blink
 * builds the function as an SVG `feDropShadow` and passes the radius straight
 * through, so an 8px radius blurs like 8, not 4. 7TV paints are authored
 * against what Chrome draws, so halving here made every paint shadow half as
 * wide as the web - worst on the glow paints, which chain up to eight of them.
 */
export function cssDropShadowBlur(radius: number): number {
  return radius;
}
