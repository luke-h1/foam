import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ChannelPredictionState } from '@app/types/twitch/prediction';

import { ChannelPredictionCard } from './ChannelPredictionCard';

const activePrediction = {
  id: 'prediction-1',
  broadcasterId: '71092938',
  broadcasterLogin: 'sodapoppin',
  broadcasterName: 'sodapoppin',
  title: 'Will we win this ranked game?',
  outcomes: [
    {
      id: 'outcome-1',
      title: 'Yes',
      color: 'blue',
      users: 812,
      channelPoints: 154_200,
      percentage: 68,
      isWinner: false,
    },
    {
      id: 'outcome-2',
      title: 'No',
      color: 'pink',
      users: 388,
      channelPoints: 72_500,
      percentage: 32,
      isWinner: false,
    },
  ],
  totalUsers: 1200,
  totalChannelPoints: 226_700,
  predictionWindowSeconds: 300,
  startedAt: new Date(Date.now() - 60_000).toISOString(),
  locksAt: new Date(Date.now() + 180_000).toISOString(),
  status: 'active',
  isActive: true,
  isLocked: false,
} satisfies ChannelPredictionState;

const resolvedPrediction = {
  ...activePrediction,
  id: 'prediction-2',
  outcomes: activePrediction.outcomes.map(outcome => ({
    ...outcome,
    isWinner: outcome.id === 'outcome-1',
  })),
  locksAt: undefined,
  lockedAt: new Date(Date.now() - 120_000).toISOString(),
  endedAt: new Date(Date.now() - 30_000).toISOString(),
  winningOutcomeId: 'outcome-1',
  status: 'resolved',
  isActive: false,
  isLocked: false,
} satisfies ChannelPredictionState;

const meta = {
  title: 'components/ChannelPredictionCard',
  component: ChannelPredictionCard,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ChannelPredictionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    channelLogin: 'sodapoppin',
    prediction: activePrediction,
  },
};

export const Resolved: Story = {
  args: {
    channelLogin: 'sodapoppin',
    prediction: resolvedPrediction,
  },
};
