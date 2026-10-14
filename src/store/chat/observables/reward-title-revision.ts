import { observable } from '@legendapp/state';

/**
 * Bumped whenever a reward title lands in `channel-point-reward-title-store.ts`.
 * The titles live in a plain Map. The few rows that show them subscribe to
 * this revision instead.
 */
export const rewardTitleRevision$ = observable(0);
