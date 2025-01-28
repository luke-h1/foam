import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { AppLoading } from './AppLoading';

const meta = {
  title: 'components/AppLoading',
  component: AppLoading,
  decorators: [
    Story => (
      <View style={{ padding: 16, alignItems: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof AppLoading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
