import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { BrandIcon } from './BrandIcon';

const meta = {
  title: 'components/BrandIcon',
  component: BrandIcon,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof BrandIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SevenTv: Story = {
  args: {
    name: 'stv',
  },
};

export const Bttv: Story = {
  args: {
    name: 'bttv',
  },
};

export const Large: Story = {
  args: {
    name: 'stv',
    size: 'lg',
  },
};

export const Colored: Story = {
  args: {
    name: 'stv',
    color: '#29b6f6',
    size: 'lg',
  },
};
