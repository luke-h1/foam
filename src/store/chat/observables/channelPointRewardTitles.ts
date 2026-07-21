import { observable } from '@legendapp/state';

/**
 * Bumped whenever a reward title lands in the caches so subscribed rows
 * re-read them; the caches themselves stay plain Maps in actions/.
 */
export const rewardTitleRevision$ = observable(0);
