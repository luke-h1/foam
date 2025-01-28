/* eslint-disable no-alert */
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { ScrollToTop } from './ScrollToTop';

const meta = {
  title: 'components/ScrollToTop',
  component: ScrollToTop,
  decorators: [
    Story => (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ScrollToTop>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onPress: () => alert('Scroll to top pressed'),
  },
};
