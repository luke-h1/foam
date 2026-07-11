import type { TwitchCheermote } from '@app/types/twitch/bits';
import { cheermoteFetchGuard } from '@app/utils/chat/cheermoteStore/cheermoteFetchGuard';
import { cheermotesByChannel } from '@app/utils/chat/cheermoteStore/cheermotesByChannel';
import {
  ChannelCheermotes,
  CheermoteTier,
} from '@app/utils/chat/cheermoteStore/types';

const MAX_CHEERMOTE_CHANNELS = 20;

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
