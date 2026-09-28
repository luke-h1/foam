import { rewardTitleRevision$ } from '@app/store/chat/observables/reward-title-revision';

export function bumpRewardTitleRevision(): void {
  rewardTitleRevision$.set(revision => revision + 1);
}
