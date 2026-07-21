import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { SharedChatSourceLabel } from './SharedChatSourceLabel';

const meta = {
  title: 'components/Chat/ChatMessage/SharedChatSourceLabel',
  component: SharedChatSourceLabel,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SharedChatSourceLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
