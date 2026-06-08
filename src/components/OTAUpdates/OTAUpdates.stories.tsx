import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { OTAUpdates } from './OTAUpdates';

const meta = {
  title: 'components/OTAUpdates',
  component: OTAUpdates,
  decorators: [
    Story => (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof OTAUpdates>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
