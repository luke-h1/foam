import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { StreamListLayoutToggle } from './StreamListLayoutToggle';

const meta = {
  title: 'components/StreamListLayoutToggle',
  component: StreamListLayoutToggle,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onChange: { action: 'Changed!' },
  },
} satisfies Meta<typeof StreamListLayoutToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CompactSelected: Story = {
  args: {
    value: 'compact',
    onChange: () => {},
  },
};

export const MediaSelected: Story = {
  args: {
    value: 'media',
    onChange: () => {},
  },
};
