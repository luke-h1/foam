import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './Badge';

const meta = {
  title: 'components/ui/Badge',
  component: Badge,
  decorators: [
    Story => (
      <View style={{ padding: 16, alignItems: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'New',
  },
};

export const Solid: Story = {
  args: {
    children: 'Live',
    variant: 'solid',
    color: 'red',
  },
};

export const OutlineWithSymbol: Story = {
  args: {
    children: 'Verified',
    variant: 'outline',
    color: 'teal',
    symbol: 'checkmark.seal.fill',
  },
};

export const LargeSubtle: Story = {
  args: {
    children: 'Subscriber',
    variant: 'subtle',
    color: 'violet',
    size: 'lg',
  },
};
