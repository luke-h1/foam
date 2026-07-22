import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './Skeleton';

const meta = {
  title: 'components/ui/Skeleton',
  component: Skeleton,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: { height: 20, width: 220 },
  },
};

export const Card: Story = {
  args: {
    style: { height: 120, width: '100%' },
  },
};

export const Avatar: Story = {
  args: {
    style: { borderRadius: 24, height: 48, width: 48 },
  },
};

export const NoShimmer: Story = {
  args: {
    shimmer: false,
    style: { height: 20, width: 220 },
  },
};
