import { useChannelActivity } from '@app/hooks/useChannelActivity';
import { channelPollActivity } from '@app/utils/twitch/channelActivity/channelPollActivity';

export function useChannelPoll(channelId?: string) {
  const { value, isAvailable } = useChannelActivity(
    channelPollActivity,
    channelId,
  );

  return {
    poll: value,
    canVoteInApp: false,
    isAvailable,
  };
}
