import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ChannelPollState } from '@app/types/twitch/poll';

import { ChannelPollCard } from './ChannelPollCard';

const activePoll = {
  id: 'poll-1',
  broadcasterId: '71092938',
  broadcasterLogin: 'sodapoppin',
  broadcasterName: 'sodapoppin',
  title: 'Which game should we play next?',
  choices: [
    {
      id: 'choice-1',
      title: 'Elden Ring',
      votes: 1240,
      channelPointsVotes: 210,
      bitsVotes: 0,
      percentage: 62,
    },
    {
      id: 'choice-2',
      title: 'Baldurs Gate 3',
      votes: 540,
      channelPointsVotes: 84,
      bitsVotes: 0,
      percentage: 27,
    },
    {
      id: 'choice-3',
      title: 'Just Chatting',
      votes: 220,
      channelPointsVotes: 12,
      bitsVotes: 0,
      percentage: 11,
    },
  ],
  totalVotes: 2000,
  channelPointsVotingEnabled: true,
  channelPointsPerVote: 10,
  durationSeconds: 180,
  startedAt: new Date(Date.now() - 60_000).toISOString(),
  endsAt: new Date(Date.now() + 120_000).toISOString(),
  status: 'active',
  isActive: true,
} satisfies ChannelPollState;

const completedPoll = {
  ...activePoll,
  id: 'poll-2',
  channelPointsVotingEnabled: false,
  endsAt: undefined,
  endedAt: new Date(Date.now() - 30_000).toISOString(),
  status: 'completed',
  isActive: false,
} satisfies ChannelPollState;

const meta = {
  title: 'components/ChannelPollCard',
  component: ChannelPollCard,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ChannelPollCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    channelLogin: 'sodapoppin',
    poll: activePoll,
  },
};

export const Completed: Story = {
  args: {
    channelLogin: 'sodapoppin',
    poll: completedPoll,
  },
};
