import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ChatImageShimmer } from './ChatImageShimmer';

const meta = {
  title: 'components/Chat/ChatMessage/ChatImageShimmer',
  component: ChatImageShimmer,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <View style={{ height: 30, width: 30 }}>
          <Story />
        </View>
      </View>
    ),
  ],
} satisfies Meta<typeof ChatImageShimmer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    animate: true,
  },
};

export const GaveUp: Story = {
  args: {
    animate: false,
  },
};
