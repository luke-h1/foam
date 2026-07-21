import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Switch } from './Switch';

const meta = {
  title: 'components/Switch',
  component: Switch,
  decorators: [
    Story => (
      <View style={{ padding: 16, alignItems: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onValueChange: { action: 'Value changed!' },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const On: Story = {
  args: {
    value: true,
    accessibilityLabel: 'Enable notifications',
  },
};

export const Off: Story = {
  args: {
    value: false,
    accessibilityLabel: 'Enable notifications',
  },
};

export const Disabled: Story = {
  args: {
    value: true,
    disabled: true,
    accessibilityLabel: 'Enable notifications',
  },
};
