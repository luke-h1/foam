import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Typography } from '../Typography';
import { Screen } from './Screen';

const meta = {
  title: 'components/Screen',
  component: Screen,
  decorators: [
    Story => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Screen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Fixed: Story = {
  args: {
    // @ts-expect-error sb type inference issues
    preset: 'fixed',
    children: (
      <View style={{ padding: 16 }}>
        <Typography>Fixed Screen Content</Typography>
      </View>
    ),
  },
};

export const Scroll: Story = {
  args: {
    // @ts-expect-error sb type inference issues
    preset: 'scroll',
    children: (
      <View style={{ padding: 16 }}>
        <Typography>Scroll Screen Content</Typography>
      </View>
    ),
  },
};

export const Auto: Story = {
  args: {
    // @ts-expect-error sb type inference issues
    preset: 'auto',
    children: (
      <View style={{ padding: 16 }}>
        <Typography>Auto Screen Content</Typography>
      </View>
    ),
  },
};

export const WithSafeArea: Story = {
  args: {
    // @ts-expect-error sb type inference issues
    preset: 'fixed',
    safeAreaEdges: ['top', 'bottom'],
    children: (
      <View style={{ padding: 16 }}>
        <Typography>Screen with Safe Area</Typography>
      </View>
    ),
  },
};

export const WithKeyboardAvoidingView: Story = {
  args: {
    // @ts-expect-error sb type inference issues
    preset: 'fixed',
    keyboardOffset: 20,
    children: (
      <View style={{ padding: 16 }}>
        <Typography>Screen with Keyboard Avoiding View</Typography>
      </View>
    ),
  },
};
