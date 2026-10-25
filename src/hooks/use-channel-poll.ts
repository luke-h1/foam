import { useChannelActivity } from '@app/hooks/use-channel-activity';
import { channelPollActivity } from '@app/utils/twitch/channel-activity/channelPollActivity';

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
