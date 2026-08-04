/**
 * `filter: drop-shadow()` blur radius → Gaussian σ.
 *
 * The prose in filter-effects-1 says the radius is twice the deviation, but
 * Blink implements the function as SVG `feDropShadow` and passes the radius
 * straight through as `stdDeviation`; measured against Chrome, a 8px radius
 * matches σ=8, not σ=4. 7TV paints are authored against that rendering, so
 * halving here makes every paint shadow half as wide as the web - most visible
 * on the glow paints, which chain up to eight of them.
 */
export function cssDropShadowSigma(radius: number): number {
  return radius;
}
