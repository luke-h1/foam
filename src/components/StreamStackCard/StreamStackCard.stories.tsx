import { Stream } from '@app/services';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { StreamStackCard } from './StreamStackCard';

const meta = {
  title: 'components/StreamStackCard',
  component: StreamStackCard,
  decorators: [
    Story => (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof StreamStackCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleStream: Stream = {
  id: '1',
  user_id: '123',
  user_login: 'sample_user',
  user_name: 'Sample User',
  game_id: '456',
  game_name: 'Sample Game',
  type: 'live',
  title: 'Sample Stream Title',
  viewer_count: 1234,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: 'https://placecats.com/millie/300/150',
  tag_ids: [],
  is_mature: false,
  tags: ['tag1', 'tag2'],
};

export const Default: Story = {
  args: {
    stream: sampleStream,
  },
};
