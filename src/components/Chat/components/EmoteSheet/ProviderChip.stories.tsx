import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type {
  EmoteMenuProvider,
  EmoteMenuSet,
} from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';

import { ProviderChip } from './ProviderChip';

const globalSet: EmoteMenuSet = {
  id: 'stv-global',
  provider: '7TV',
  title: 'Global Emotes',
  icon: 'stv',
  shortLabel: 'GE',
  emotes: seventvSanitiisedGlobalEmoteSetFixture.slice(0, 12),
};

const sevenTvProvider: EmoteMenuProvider = {
  id: '7TV',
  title: '7TV',
  icon: 'stv',
  emoteCount: globalSet.emotes.length,
  sets: [globalSet],
};

const emojiProvider: EmoteMenuProvider = {
  id: 'Emoji',
  title: 'Emoji',
  icon: 'emoji:😀',
  emoteCount: 24,
  sets: [],
};

const meta = {
  title: 'components/Chat/EmoteSheet/ProviderChip',
  component: ProviderChip,
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
  argTypes: {
    onSelect: { action: 'onSelect' },
  },
} satisfies Meta<typeof ProviderChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    isActive: true,
    provider: sevenTvProvider,
    onSelect: () => {},
  },
};

export const Inactive: Story = {
  args: {
    isActive: false,
    provider: sevenTvProvider,
    onSelect: () => {},
  },
};

export const EmojiProvider: Story = {
  args: {
    isActive: true,
    provider: emojiProvider,
    onSelect: () => {},
  },
};
