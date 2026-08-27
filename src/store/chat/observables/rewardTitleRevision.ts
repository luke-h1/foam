import { observable } from '@legendapp/state';

/**
 * Bumped whenever a reward title lands in `channelPointRewardTitleStore.ts` -
 * the Map+revision hybrid for hot imperative caches a few rows subscribe to.
 */
export const rewardTitleRevision$ = observable(0);
