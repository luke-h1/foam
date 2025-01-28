import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Spinner } from './Spinner';

const meta = {
  title: 'components/Spinner',
  component: Spinner,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
