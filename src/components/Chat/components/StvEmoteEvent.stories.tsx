import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { SanitisedEmote } from '@app/types/emote';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { StvEmoteEvent } from './StvEmoteEvent';

const emoteFixture = {
  id: 'emote-1',
  name: 'catJAM',
  original_name: 'catJAM',
  url: 'https://placecats.com/112/56',
  static_url: 'https://placecats.com/112/56',
  creator: 'pixelpirate',
  emote_link: 'https://betterttv.com/emotes/emote-1',
  site: 'BTTV',
} satisfies SanitisedEmote;

const addedPart = {
  type: 'stv_emote_added',
  stvEvents: {
    type: 'added',
    data: emoteFixture,
  },
} satisfies ParsedPart<'stv_emote_added'>;

const removedPart = {
  type: 'stv_emote_removed',
  stvEvents: {
    type: 'removed',
    data: emoteFixture,
  },
} satisfies ParsedPart<'stv_emote_removed'>;

const meta = {
  title: 'components/Chat/StvEmoteEvent',
  component: StvEmoteEvent,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#0E0E10', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  args: {
    part: addedPart,
  },
} satisfies Meta<typeof StvEmoteEvent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Added: Story = {};

export const Removed: Story = {
  args: {
    part: removedPart,
  },
};

export const StaticEmote: Story = {
  args: {
    disableAnimations: true,
  },
};
