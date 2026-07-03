import type { TwitchCheermote } from '@app/types/twitch/bits';

export interface CheermoteTier {
  color: string;
  minBits: number;
  staticUrl: string;
  url: string;
}

/**
 * Lowercased cheer prefix -> tiers sorted by ascending min_bits.
 */
export type ChannelCheermotes = Map<string, CheermoteTier[]>;

// Session cache; cheermote sets change rarely, so a fetch per channel per
// session (refreshed after the TTL) is plenty.
const CHEERMOTE_TTL_MS = 30 * 60 * 1000;

const cheermotesByChannel = new Map<string, ChannelCheermotes>();
const fetchedAtByChannel = new Map<string, number>();
const inflightChannels = new Set<string>();

function pickImageUrl(images: Record<string, string>): string {
  return images['2'] ?? images['1'] ?? Object.values(images)[0] ?? '';
}

export function setChannelCheermotes(
  channelId: string,
  cheermotes: TwitchCheermote[],
): void {
  const byPrefix: ChannelCheermotes = new Map();

  cheermotes.forEach(cheermote => {
    const tiers: CheermoteTier[] = [];
    for (const tier of cheermote.tiers) {
      if (!tier.can_cheer) {
        continue;
      }
      tiers.push({
        color: tier.color,
        minBits: tier.min_bits,
        staticUrl: pickImageUrl(tier.images.dark.static),
        url: pickImageUrl(tier.images.dark.animated),
      });
    }
    tiers.sort((a, b) => a.minBits - b.minBits);

    if (tiers.length > 0) {
      byPrefix.set(cheermote.prefix.toLowerCase(), tiers);
    }
  });

  cheermotesByChannel.set(channelId, byPrefix);
  fetchedAtByChannel.set(channelId, Date.now());
  inflightChannels.delete(channelId);
}

export function getChannelCheermotes(
  channelId: string,
): ChannelCheermotes | undefined {
  return cheermotesByChannel.get(channelId);
}

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

export function shouldFetchChannelCheermotes(channelId: string): boolean {
  if (inflightChannels.has(channelId)) {
    return false;
  }
  const fetchedAt = fetchedAtByChannel.get(channelId);
  return fetchedAt === undefined || Date.now() - fetchedAt >= CHEERMOTE_TTL_MS;
}

export function markChannelCheermotesFetching(channelId: string): void {
  inflightChannels.add(channelId);
}

export function markChannelCheermotesFetchFailed(channelId: string): void {
  inflightChannels.delete(channelId);
}

export function clearCheermotes(): void {
  cheermotesByChannel.clear();
  fetchedAtByChannel.clear();
  inflightChannels.clear();
}
