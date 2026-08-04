/**
 * `text-shadow` blur radius → Gaussian σ. Unlike `filter: drop-shadow()`,
 * text-shadow keeps the box-shadow convention of σ = radius / 2, which is what
 * Chrome renders.
 */
export function cssTextShadowSigma(radius: number): number {
  return radius / 2;
}
