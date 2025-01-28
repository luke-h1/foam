import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { BuildDetails } from './BuildDetails';

const meta = {
  title: 'components/BuildDetails',
  component: BuildDetails,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof BuildDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
