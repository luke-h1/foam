import type { TwitchCheermote } from '@app/types/twitch/bits';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';

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

/**
 * Session cache; cheermote sets change rarely, so a fetch per channel per
 * session (refreshed after the TTL) is plenty.
 */
const CHEERMOTE_TTL_MS = 30 * 60 * 1000;

const MAX_CHEERMOTE_CHANNELS = 20;

const cheermotesByChannel = new Map<string, ChannelCheermotes>();
const cheermoteFetchGuard = createFetchOnceGuard({ ttlMs: CHEERMOTE_TTL_MS });

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

  /**
   * The Map doubles as an LRU: delete-before-set moves the channel to the
   * newest position, so eviction takes the least recently used key.
   */
  cheermotesByChannel.delete(channelId);
  if (cheermotesByChannel.size >= MAX_CHEERMOTE_CHANNELS) {
    const oldest = cheermotesByChannel.keys().next().value;
    if (oldest !== undefined) {
      cheermotesByChannel.delete(oldest);
      cheermoteFetchGuard.clearKey(oldest);
    }
  }
  cheermotesByChannel.set(channelId, byPrefix);
  cheermoteFetchGuard.markFetched(channelId);
}

export function getChannelCheermotes(
  channelId: string,
): ChannelCheermotes | undefined {
  const cheermotes = cheermotesByChannel.get(channelId);
  if (cheermotes) {
    cheermotesByChannel.delete(channelId);
    cheermotesByChannel.set(channelId, cheermotes);
  }
  return cheermotes;
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

/**
 * Fetches and stores a channel's cheermotes at most once per TTL window,
 * deduping while a fetch is in flight. A rejected fetcher propagates to the
 * caller and leaves the channel immediately retryable.
 */
export function fetchChannelCheermotes(
  channelId: string,
  fetcher: () => Promise<TwitchCheermote[]>,
): Promise<void> {
  if (!cheermoteFetchGuard.shouldFetch(channelId)) {
    return Promise.resolve();
  }
  return cheermoteFetchGuard.run(channelId, async ctx => {
    const cheermotes = await fetcher();
    if (ctx.stillCurrent()) {
      setChannelCheermotes(channelId, cheermotes);
    }
  });
}

export function clearCheermotes(): void {
  cheermotesByChannel.clear();
  cheermoteFetchGuard.clear();
}
