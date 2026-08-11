import { observable } from '@legendapp/state';

/**
 * Bumped whenever a channel-point reward title lands in the caches in
 * `utils/chat/channelPointRewardTitleStore.ts` - the Map+revision hybrid for
 * hot imperative caches that a few rows subscribe to.
 */
export const rewardTitleRevision$ = observable(0);
