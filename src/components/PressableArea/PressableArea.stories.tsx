import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Text } from '@app/components/ui/Text/Text';

import { PressableArea } from './PressableArea';

const meta = {
  title: 'components/PressableArea',
  component: PressableArea,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onPress: { action: 'Pressed!' },
  },
} satisfies Meta<typeof PressableArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <View
        style={{
          backgroundColor: '#1C1C1E',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <Text weight='semibold'>Press me</Text>
      </View>
    ),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: (
      <View
        style={{
          backgroundColor: '#1C1C1E',
          borderRadius: 12,
          opacity: 0.5,
          padding: 16,
        }}
      >
        <Text weight='semibold'>Disabled</Text>
      </View>
    ),
  },
};
