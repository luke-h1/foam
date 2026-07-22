import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { LiveStreamCardSkeleton } from './LiveStreamCardSkeleton';

const meta = {
  title: 'components/LiveStreamCardSkeleton',
  component: LiveStreamCardSkeleton,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof LiveStreamCardSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  args: {},
};

export const Media: Story = {
  args: {
    layout: 'media',
  },
};
