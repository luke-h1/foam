import { twitchService } from '@app/services/twitch-service';
import type {
  ChannelPollState,
  TwitchEventSubPoll,
  TwitchHelixPoll,
} from '@app/types/twitch/poll';
import type { ChannelActivity } from '@app/utils/twitch/channelActivity/channelActivity';
import {
  normaliseEventSubPoll,
  normaliseHelixPoll,
} from '@app/utils/twitch/normalisePoll';

export const channelPollActivity = {
  fetch: (broadcasterId: string) =>
    twitchService.getPolls({ broadcasterId, first: 1 }),
  normaliseHelix: normaliseHelixPoll,
  isActive: (poll: ChannelPollState) => poll.isActive,
  fetchFailure: {
    message: 'Failed to fetch initial Twitch poll state',
    name: 'twitch_polls_warning',
    action: 'initial_poll_fetch_failed',
  },
  // SAFETY: each handler only receives its own channel.poll.* subscription payload, which Twitch types as TwitchEventSubPoll.
  events: [
    {
      type: 'channel.poll.begin',
      normalise: event =>
        normaliseEventSubPoll(event as TwitchEventSubPoll, 'active'),
    },
    {
      type: 'channel.poll.progress',
      normalise: event =>
        normaliseEventSubPoll(event as TwitchEventSubPoll, 'active'),
    },
    {
      type: 'channel.poll.end',
      normalise: event =>
        normaliseEventSubPoll(event as TwitchEventSubPoll, 'completed'),
    },
  ],
} satisfies ChannelActivity<TwitchHelixPoll, ChannelPollState>;
