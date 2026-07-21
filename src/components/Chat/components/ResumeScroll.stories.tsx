import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ResumeScroll } from './ResumeScroll';

const meta = {
  title: 'components/Chat/ResumeScroll',
  component: ResumeScroll,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onScrollToBottom: { action: 'onScrollToBottom' },
  },
  args: {
    unreadCount: 12,
    onScrollToBottom: () => {},
  },
} satisfies Meta<typeof ResumeScroll>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithUnread: Story = {};

export const NoUnread: Story = {
  args: {
    unreadCount: 0,
  },
};

export const ManyUnread: Story = {
  args: {
    unreadCount: 250,
  },
};
