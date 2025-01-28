import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Seperator } from './Seperator';

const meta = {
  title: 'components/Seperator',
  component: Seperator,
  decorators: [
    Story => (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Seperator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    color: 'borderNeutral',
    size: 0.5,
  },
};

export const CustomColor: Story = {
  args: {
    color: 'brightPurple',
    size: 0.5,
  },
};

export const CustomSize: Story = {
  args: {
    color: 'borderNeutral',
    size: 2,
  },
};
