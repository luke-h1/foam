import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'components/EmptyState',
  component: EmptyState,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
