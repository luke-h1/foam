import { CheermoteTier } from '@app/utils/chat/cheermoteStore/types';

/**
 * Highest tier whose min_bits threshold the cheered amount reaches.
 */
export function resolveCheermoteTier(
  tiers: CheermoteTier[],
  bits: number,
): CheermoteTier | undefined {
  let resolved: CheermoteTier | undefined;
  for (const tier of tiers) {
    if (bits >= tier.minBits) {
      resolved = tier;
    } else {
      break;
    }
  }
  return resolved;
}
