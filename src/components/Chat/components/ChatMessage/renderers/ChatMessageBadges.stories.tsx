import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import {
  chatterinoBadge,
  ffzModBadge,
  ffzVipBadge,
  mockBadges,
  mockModBadges,
} from '../richChatMessageStoryFixtures';
import { ChatMessageBadges } from './ChatMessageBadges';

const meta = {
  title: 'components/Chat/ChatMessage/ChatMessageBadges',
  component: ChatMessageBadges,
  decorators: [
    Story => (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#0E0E10',
          flex: 1,
          flexDirection: 'row',
          gap: 4,
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  args: {
    compact: false,
    getMappingKey: (key: string) => key,
  },
  argTypes: {
    onBadgePress: { action: 'onBadgePress' },
  },
} satisfies Meta<typeof ChatMessageBadges>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwitchBadges: Story = {
  args: {
    badges: mockBadges,
    onBadgePress: () => {},
  },
};

export const ModeratorBadges: Story = {
  args: {
    badges: mockModBadges,
  },
};

export const ThirdPartyBadges: Story = {
  args: {
    badges: [ffzVipBadge, ffzModBadge, chatterinoBadge],
  },
};

export const ModeratedDimmed: Story = {
  args: {
    badges: mockBadges,
    moderationNotice: 'timeout',
  },
};
