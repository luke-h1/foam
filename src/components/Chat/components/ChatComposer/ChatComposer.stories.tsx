import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ChatComposer } from './ChatComposer';

const meta = {
  title: 'components/Chat/ChatComposer',
  component: ChatComposer,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onChangeText: { action: 'onChangeText' },
    onSubmit: { action: 'onSubmit' },
    onPressAdd: { action: 'onPressAdd' },
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CanSend: Story = {
  args: {
    canSend: true,
  },
};

export const Disabled: Story = {
  args: {
    editable: false,
    placeholder: 'Sign in to send messages',
  },
};
