import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { TwitchStream } from '@app/types/twitch/stream';

import { MemoizedLiveStreamCard } from './LiveStreamCard';

const queryClient = new QueryClient();

const stream = {
  id: '40952121085',
  user_id: '71092938',
  user_login: 'sodapoppin',
  user_name: 'sodapoppin',
  game_id: '509658',
  game_name: 'Just Chatting',
  type: 'live',
  title: 'CLICK HERE - games, reacts and more all day long',
  viewer_count: 84213,
  started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  language: 'en',
  thumbnail_url: 'https://placecats.com/{width}/{height}',
  tag_ids: [],
  tags: ['English'],
  is_mature: false,
} satisfies TwitchStream;

const meta = {
  title: 'components/LiveStreamCard',
  component: MemoizedLiveStreamCard,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <View style={{ padding: 16, justifyContent: 'flex-start' }}>
          <Story />
        </View>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof MemoizedLiveStreamCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  args: {
    stream,
  },
};

export const Media: Story = {
  args: {
    stream: {
      ...stream,
      profilePicture: 'https://placecats.com/200/200',
    },
    layout: 'media',
  },
};

export const MediaWithoutAvatar: Story = {
  args: {
    stream,
    layout: 'media',
  },
};
