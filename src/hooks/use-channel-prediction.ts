import { useChannelActivity } from '@app/hooks/use-channel-activity';
import { channelPredictionActivity } from '@app/utils/twitch/channel-activity/channel-prediction-activity';

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
