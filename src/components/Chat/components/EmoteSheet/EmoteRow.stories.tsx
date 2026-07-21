import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';

import { EmoteRow } from './EmoteRow';

const meta = {
  title: 'components/Chat/EmoteSheet/EmoteRow',
  component: EmoteRow,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onPress: { action: 'onPress' },
  },
} satisfies Meta<typeof EmoteRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Emotes: Story = {
  args: {
    cellSize: 44,
    items: seventvSanitiisedGlobalEmoteSetFixture.slice(0, 6),
    onPress: () => {},
  },
};

export const Emojis: Story = {
  args: {
    cellSize: 44,
    items: ['😀', '😂', '😍', '🥳', '😎', '🤔'],
    onPress: () => {},
  },
};

export const Mixed: Story = {
  args: {
    cellSize: 44,
    items: [...seventvSanitiisedGlobalEmoteSetFixture.slice(0, 3), '🔥', '💜'],
    onPress: () => {},
  },
};
