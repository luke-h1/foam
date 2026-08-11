import { useSelector } from '@legendapp/state/react';

import { rewardTitleRevision$ } from '@app/store/chat/observables/rewardTitleRevision';

export function useChannelPointRewardTitleRevision(): number {
  return useSelector(rewardTitleRevision$);
}
