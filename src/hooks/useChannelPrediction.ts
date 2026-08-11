import { useChannelActivity } from '@app/hooks/useChannelActivity';
import { channelPredictionActivity } from '@app/utils/twitch/channelActivity/channelPredictionActivity';

export function useChannelPrediction(channelId?: string) {
  const { value, isAvailable } = useChannelActivity(
    channelPredictionActivity,
    channelId,
  );

  return {
    prediction: value,
    canVoteInApp: false,
    isAvailable,
  };
}
