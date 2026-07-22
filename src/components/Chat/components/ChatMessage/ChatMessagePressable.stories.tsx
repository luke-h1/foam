import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Text } from '@app/components/ui/Text/Text';

import { ChatMessagePressable } from './ChatMessagePressable';

const meta = {
  title: 'components/Chat/ChatMessage/ChatMessagePressable',
  component: ChatMessagePressable,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onPress: { action: 'onPress' },
    onLongPress: { action: 'onLongPress' },
  },
} satisfies Meta<typeof ChatMessagePressable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Pressable: Story = {
  args: {
    children: <Text>Tap or long-press me</Text>,
    onPress: () => {},
    onLongPress: () => {},
  },
};

export const Static: Story = {
  args: {
    children: <Text>No handlers, renders as a plain View</Text>,
  },
};

export const Disabled: Story = {
  args: {
    children: <Text>Disabled pressable</Text>,
    disabled: true,
    onPress: () => {},
  },
};
