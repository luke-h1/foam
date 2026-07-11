import type { TwitchCheermote } from '@app/types/twitch/bits';
import { cheermoteFetchGuard } from '@app/utils/chat/cheermoteStore/cheermoteFetchGuard';
import { setChannelCheermotes } from '@app/utils/chat/cheermoteStore/setChannelCheermotes';

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
