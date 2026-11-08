import type { CheermoteTier } from '@app/utils/chat/cheermote-store/types';

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
