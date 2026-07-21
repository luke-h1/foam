import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { RichChatMessageUsername } from './RichChatMessageUsername';

const meta = {
  title: 'components/Chat/ChatMessage/RichChatMessageUsername',
  component: RichChatMessageUsername,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onUsernamePress: { action: 'onUsernamePress' },
  },
} satisfies Meta<typeof RichChatMessageUsername>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    compact: false,
    username: 'TestUser',
    userstateColor: '#1AC9A2',
  },
};

export const Compact: Story = {
  args: {
    compact: true,
    username: 'CompactUser',
    userstateColor: '#9B59B6',
  },
};

export const Moderated: Story = {
  args: {
    compact: false,
    isModerated: true,
    username: 'BannedUser',
    userstateColor: '#FF6B6B',
  },
};

export const Pressable: Story = {
  args: {
    compact: false,
    username: 'PressableUser',
    userstateColor: '#00D9FF',
    onUsernamePress: () => {},
  },
};
