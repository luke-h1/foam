import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';

import { EmoteCell } from './EmoteCell';

const emoteFixture = seventvSanitiisedGlobalEmoteSetFixture[0];

if (!emoteFixture) {
  throw new Error('7TV emote fixture is missing');
}

const meta = {
  title: 'components/Chat/EmoteSheet/EmoteCell',
  component: EmoteCell,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          padding: 16,
          flexDirection: 'row',
        }}
      >
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof EmoteCell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Emote: Story = {
  args: {
    cellSize: 48,
    item: emoteFixture,
  },
};

export const Emoji: Story = {
  args: {
    cellSize: 48,
    item: '😂',
  },
};

export const LargeCell: Story = {
  args: {
    cellSize: 72,
    item: emoteFixture,
  },
};
