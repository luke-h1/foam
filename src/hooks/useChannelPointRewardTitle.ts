import { twitchService } from '@app/services/twitch-service';
import { useEffect, useState } from 'react';

export function useChannelPointRewardTitle(
  broadcasterId: string | undefined,
  rewardId: string | undefined,
  shouldFetch: boolean,
): string | undefined {
  const [title, setTitle] = useState<string | undefined>();

  useEffect(() => {
    if (!shouldFetch || !broadcasterId || !rewardId) {
      setTitle(undefined);
      return;
    }

    let cancelled = false;
    void twitchService
      .getCustomChannelRewardTitle(broadcasterId, rewardId)
      .then(resolved => {
        if (!cancelled) setTitle(resolved);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, broadcasterId, rewardId]);

  return title;
}
