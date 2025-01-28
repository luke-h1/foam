import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { TextField } from './TextField';

const meta = {
  title: 'components/TextField',
  component: TextField,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Default Label',
    placeholder: 'Enter text...',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Label with Helper Text',
    placeholder: 'Enter text...',
    helper: 'This is a helper text',
  },
};

export const WithError: Story = {
  args: {
    label: 'Label with Error',
    placeholder: 'Enter text...',
    status: 'error',
    helper: 'This is an error message',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Label',
    placeholder: 'Enter text...',
    editable: false,
  },
};

export const WithLeftAccessory: Story = {
  args: {
    label: 'Label with Left Accessory',
    placeholder: 'Enter text...',
    LeftAccessory: () => (
      <View style={{ padding: 10, backgroundColor: 'red' }} />
    ),
  },
};

export const WithRightAccessory: Story = {
  args: {
    label: 'Label with Right Accessory',
    placeholder: 'Enter text...',
    RightAccessory: () => (
      <View style={{ padding: 10, backgroundColor: 'blue' }} />
    ),
  },
};
