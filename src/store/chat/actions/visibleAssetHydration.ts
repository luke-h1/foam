import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { logger } from '@app/utils/logger';

const VISIBLE_ASSET_HYDRATION_DELAY_MS = 150;

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
 *
 * The debounce timer, epoch and in-flight pass live here beside the state
 * they guard, so arming and releasing the pass are owned by one module: any
 * clear below invalidates a scheduled or running pass with it.
 */
export const visibleAssetHydration = {
  hydratedMessageKeys: new Set<string>(),
  personalEmoteUsers: new Set<string>(),
  cosmeticUsers: new Set<string>(),
  pendingMessages: [] as AnyChatMessageType[],
  epoch: 0,
  timer: null as ReturnType<typeof setTimeout> | null,
  activePass: null as Promise<void> | null,
};

function clearVisibleAssetHydrationTimer(): void {
  if (visibleAssetHydration.timer) {
    clearTimeout(visibleAssetHydration.timer);
    visibleAssetHydration.timer = null;
  }
}

/**
 * Invalidates any scheduled or in-flight pass without dropping the dedup
 * keys. Called when the pass's inputs (channel, preference gates) change.
 */
export function invalidateVisibleAssetHydrationPass(): void {
  visibleAssetHydration.epoch += 1;
  clearVisibleAssetHydrationTimer();
}

/**
 * Called on channel switch and unmount: a new channel's rows must not inherit
 * the previous channel's hydration keys, and a pass armed for the old channel
 * must not run against the new one's messages.
 */
export function clearVisibleAssetHydration(): void {
  visibleAssetHydration.hydratedMessageKeys.clear();
  visibleAssetHydration.personalEmoteUsers.clear();
  visibleAssetHydration.cosmeticUsers.clear();
  visibleAssetHydration.pendingMessages = [];
  invalidateVisibleAssetHydrationPass();
}

/**
 * Debounces `runPass` behind one shared timer, serialised behind any pass
 * still in flight. `runPass` is skipped if the epoch moves before it starts;
 * it receives the epoch it was armed under so it can stop mid-pass via
 * `visibleAssetHydration.epoch` comparison.
 */
export function scheduleVisibleAssetHydrationPass(
  runPass: (epoch: number) => Promise<void> | undefined,
): void {
  if (visibleAssetHydration.timer) {
    return;
  }

  const epoch = visibleAssetHydration.epoch;

  visibleAssetHydration.timer = setTimeout(() => {
    visibleAssetHydration.timer = null;

    const previousPass = visibleAssetHydration.activePass ?? Promise.resolve();
    const pass = previousPass
      .then(() => {
        if (visibleAssetHydration.epoch !== epoch) {
          return undefined;
        }
        return runPass(epoch);
      })
      .catch(error => {
        logger.chat.debug('Visible-asset hydration pass failed:', error);
      });

    visibleAssetHydration.activePass = pass;
    void pass.then(() => {
      if (visibleAssetHydration.activePass === pass) {
        visibleAssetHydration.activePass = null;
      }
    });
  }, VISIBLE_ASSET_HYDRATION_DELAY_MS);
}
