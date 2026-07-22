import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { LiveBadge } from './LiveBadge';

const meta = {
  title: 'components/LiveBadge',
  component: LiveBadge,
  decorators: [
    Story => (
      <View
        style={{
          padding: 16,
          alignItems: 'flex-start',
          backgroundColor: '#333',
        }}
      >
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof LiveBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overlay: Story = {
  args: {},
};

export const Tinted: Story = {
  args: {
    tone: 'tinted',
  },
};

export const CustomLabel: Story = {
  args: {
    tone: 'tinted',
    label: 'REDIFF',
  },
};
