import { rewardTitleRevision$ } from '@app/store/chat/observables/rewardTitleRevision';

export function bumpRewardTitleRevision(): void {
  rewardTitleRevision$.set(revision => revision + 1);
}
