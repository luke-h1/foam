import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { LoadingState } from './LoadingState';

const meta = {
  title: 'components/LoadingState',
  component: LoadingState,
  decorators: [
    Story => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof LoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    indicatorSize: 'small',
  },
};

export const CustomSize: Story = {
  args: {
    indicatorSize: 56,
  },
};
