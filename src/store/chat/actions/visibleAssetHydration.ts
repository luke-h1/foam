import type { AnyChatMessageType } from '@app/store/chat/types/constants';

/**
 * Scratch state for the visible-asset hydration pass: which rows have already
 * been hydrated, which users have had personal emotes / cosmetics fetched, and
 * the rows waiting on the next debounced pass.
 *
 * Plain module state rather than an observable or a bag of React refs. Ingest
 * and the hydration pass only ever read and write it imperatively - nothing
 * renders off it - and as refs it had to be created in a hook that had no
 * other business owning it, then drilled two levels down to the only consumer.
 * The sets are bounded by `boundedSetAdd` at their write sites.
 */
export const visibleAssetHydration = {
  hydratedMessageKeys: new Set<string>(),
  personalEmoteUsers: new Set<string>(),
  cosmeticUsers: new Set<string>(),
  pendingMessages: [] as AnyChatMessageType[],
  timer: null as ReturnType<typeof setTimeout> | null,
};

/**
 * Called on channel switch and unmount: a new channel's rows must not inherit
 * the previous channel's hydration keys.
 */
export function clearVisibleAssetHydration(): void {
  visibleAssetHydration.hydratedMessageKeys.clear();
  visibleAssetHydration.personalEmoteUsers.clear();
  visibleAssetHydration.cosmeticUsers.clear();
  visibleAssetHydration.pendingMessages = [];

  if (visibleAssetHydration.timer) {
    clearTimeout(visibleAssetHydration.timer);
    visibleAssetHydration.timer = null;
  }
}
