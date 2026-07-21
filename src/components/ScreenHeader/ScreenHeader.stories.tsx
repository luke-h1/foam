import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { ScreenHeader } from './ScreenHeader';

const meta = {
  title: 'components/ScreenHeader',
  component: ScreenHeader,
  decorators: [
    Story => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ScreenHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Large: Story = {
  args: {
    title: 'Following',
    subtitle: 'Live channels',
    safeArea: false,
  },
};

export const Compact: Story = {
  args: {
    title: 'Settings',
    size: 'compact',
    safeArea: false,
  },
};

export const Hero: Story = {
  args: {
    title: 'Just Chatting',
    subtitle: '412K viewers',
    size: 'hero',
    safeArea: false,
    backgroundImage: 'https://placecats.com/860/484',
    featuredImage: 'https://placecats.com/300/400',
  },
};

export const WithShare: Story = {
  args: {
    title: 'sodapoppin',
    subtitle: 'Streamer profile',
    safeArea: false,
    share: {
      label: 'Share channel',
      onPress: () => {},
    },
  },
};
