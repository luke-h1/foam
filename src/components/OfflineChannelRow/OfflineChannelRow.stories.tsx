import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';

import { MemoizedOfflineChannelRow } from './OfflineChannelRow';

const channel = {
  broadcaster_id: '71092938',
  broadcaster_login: 'sodapoppin',
  broadcaster_name: 'sodapoppin',
  followed_at: '2023-04-12T18:25:43Z',
  profile_image_url: 'https://placecats.com/200/200',
} satisfies FollowedChannelWithProfile;

const meta = {
  title: 'components/OfflineChannelRow',
  component: MemoizedOfflineChannelRow,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof MemoizedOfflineChannelRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAvatar: Story = {
  args: {
    channel,
  },
};

export const WithoutAvatar: Story = {
  args: {
    channel: {
      ...channel,
      profile_image_url: undefined,
    },
  },
};
