import { useSelector } from '@legendapp/state/react';

import { rewardTitleRevision$ } from '@app/store/chat/observables/reward-title-revision';

export function useChannelPointRewardTitleRevision(): number {
  return useSelector(rewardTitleRevision$);
}
