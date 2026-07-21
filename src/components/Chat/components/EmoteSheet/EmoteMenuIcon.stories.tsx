import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { EmoteMenuIcon } from './EmoteMenuIcon';

const meta = {
  title: 'components/Chat/EmoteSheet/EmoteMenuIcon',
  component: EmoteMenuIcon,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          padding: 16,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof EmoteMenuIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SevenTv: Story = {
  args: {
    icon: 'stv',
    isActive: false,
  },
};

export const Twitch: Story = {
  args: {
    icon: 'twitch',
    isActive: false,
  },
};

export const FrankerFaceZ: Story = {
  args: {
    icon: 'ffz',
    isActive: false,
  },
};

export const Emoji: Story = {
  args: {
    icon: 'emoji:😀',
    isActive: false,
  },
};
