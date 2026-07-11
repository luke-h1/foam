/**
 * CSS blur radius → Gaussian σ (filter-effects-1: σ = r/2).
 */
export function cssDropShadowSigma(radius: number): number {
  return radius / 2;
}
