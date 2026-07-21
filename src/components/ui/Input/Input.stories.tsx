import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta = {
  title: 'components/ui/Input',
  component: Input,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onSubmitEditing: { action: 'Submitted!' },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Outline: Story = {
  args: {
    placeholder: 'Search channels',
  },
};

export const Soft: Story = {
  args: {
    placeholder: 'Search channels',
    variant: 'soft',
    color: 'neutral',
  },
};

export const Underline: Story = {
  args: {
    placeholder: 'Add a blocked term',
    variant: 'underline',
  },
};

export const LargeSubtle: Story = {
  args: {
    placeholder: 'Send a message',
    variant: 'subtle',
    size: 'lg',
    color: 'violet',
  },
};
