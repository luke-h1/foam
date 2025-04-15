import { Bit } from '@app/store/chatStore';

export function findBitEntryAndTier(
  prefix: string,
  bits: string,
  bitData: Bit[],
) {
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of bitData) {
    if (entry.name.toLowerCase() !== prefix) {
      // eslint-disable-next-line no-continue
      continue;
    }

    for (let i = 0; i < entry.tiers.length; i += 1) {
      const currentTier = entry.tiers[i];
      const nextTier = entry.tiers[i + 1];

      if (!nextTier && bits >= currentTier?.min_bits) {
        return {
          name: entry.name,
          tier: currentTier,
        };
      }

      if (bits >= currentTier?.min_bits && bits < nextTier?.min_bits) {
        return {
          name: entry.name,
          tier: currentTier,
        };
      }
    }
  }
  return null;
}
