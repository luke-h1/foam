import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'components/SegmentedControl',
  component: SegmentedControl,
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
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwoSegments: Story = {
  args: {
    items: [{ label: 'VODs' }, { label: 'Clips' }],
    currentIndex: 0,
    onChange: () => {},
  },
};

export const ThreeSegments: Story = {
  args: {
    items: [{ label: 'Live' }, { label: 'Clips' }, { label: 'Videos' }],
    currentIndex: 1,
    onChange: () => {},
  },
};
