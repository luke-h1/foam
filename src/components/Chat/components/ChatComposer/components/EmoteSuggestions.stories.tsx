import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { SanitisedEmote } from '@app/types/emote';

import { EmoteSuggestions } from './EmoteSuggestions';

const emoteFixtures = [
  {
    id: 'emote-1',
    name: 'catJAM',
    original_name: 'catJAM',
    url: 'https://placecats.com/56/56',
    creator: 'pixelpirate',
    emote_link: 'https://betterttv.com/emotes/emote-1',
    site: 'BTTV',
  },
  {
    id: 'emote-2',
    name: 'monkaCat',
    original_name: 'monkaCat',
    url: 'https://placecats.com/57/57',
    creator: null,
    emote_link: 'https://betterttv.com/emotes/emote-2',
    site: 'Global BTTV',
  },
  {
    id: 'emote-3',
    name: 'CatBag',
    original_name: 'CatBag',
    url: 'https://placecats.com/58/58',
    creator: 'ffzuser',
    emote_link: 'https://www.frankerfacez.com/emoticon/emote-3',
    site: 'FFZ',
  },
] satisfies SanitisedEmote[];

const meta = {
  title: 'components/Chat/ChatComposer/EmoteSuggestions',
  component: EmoteSuggestions,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  argTypes: {
    handleEmotePress: { action: 'handleEmotePress' },
  },
  args: {
    emotes: emoteFixtures,
    handleEmotePress: () => {},
  },
} satisfies Meta<typeof EmoteSuggestions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleEmote: Story = {
  args: {
    emotes: emoteFixtures.slice(0, 1),
  },
};
