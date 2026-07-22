import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';

import { SetHeader } from './SetHeader';

const globalSet: EmoteMenuSet = {
  id: 'stv-global',
  provider: '7TV',
  title: 'Global Emotes',
  icon: 'stv',
  shortLabel: 'GE',
  emotes: seventvSanitiisedGlobalEmoteSetFixture.slice(0, 12),
};

const emojiSet: EmoteMenuSet = {
  id: 'emoji-smileys',
  provider: 'Emoji',
  title: 'Smileys',
  icon: 'emoji:😀',
  shortLabel: '😀',
  emotes: ['😀', '😂', '😍'],
};

const meta = {
  title: 'components/Chat/EmoteSheet/SetHeader',
  component: SetHeader,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SetHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SevenTvSet: Story = {
  args: {
    set: globalSet,
  },
};

export const EmojiSet: Story = {
  args: {
    set: emojiSet,
  },
};
