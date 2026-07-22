import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';

import { SetRailButton } from './SetRailButton';

const labelSet: EmoteMenuSet = {
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

const avatarSet: EmoteMenuSet = {
  id: 'subscriber-channel',
  provider: 'Twitch',
  title: 'Channel Subscriber Emotes',
  icon: 'avatar:https://placecats.com/48/48',
  shortLabel: 'CS',
  emotes: [],
};

const meta = {
  title: 'components/Chat/EmoteSheet/SetRailButton',
  component: SetRailButton,
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
    onScrollToSet: { action: 'onScrollToSet' },
  },
} satisfies Meta<typeof SetRailButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ActiveLabel: Story = {
  args: {
    isActive: true,
    set: labelSet,
    onScrollToSet: () => {},
  },
};

export const InactiveLabel: Story = {
  args: {
    isActive: false,
    set: labelSet,
    onScrollToSet: () => {},
  },
};

export const EmojiIcon: Story = {
  args: {
    isActive: false,
    set: emojiSet,
    onScrollToSet: () => {},
  },
};

export const AvatarIcon: Story = {
  args: {
    isActive: false,
    set: avatarSet,
    onScrollToSet: () => {},
  },
};
