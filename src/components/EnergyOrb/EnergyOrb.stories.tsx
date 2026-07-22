import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { EnergyOrb } from './EnergyOrb';

const meta = {
  title: 'components/EnergyOrb',
  component: EnergyOrb,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof EnergyOrb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomColors: Story = {
  args: {
    colors: ['#ff5f6d', '#ffc371', '#8a2be2'],
    intensity: 1.4,
  },
};

export const Small: Story = {
  args: {
    width: 80,
    height: 80,
    speed: 2,
  },
};
