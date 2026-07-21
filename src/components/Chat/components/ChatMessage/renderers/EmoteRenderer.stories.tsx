import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import {
  stvGlobalBaseEmote,
  stvGlobalEmote1,
} from '../richChatMessageStoryFixtures';
import { EmoteRenderer } from './EmoteRenderer';

const twitchEmotePart: ParsedPart<'emote'> = {
  type: 'emote',
  content: 'Kappa',
  original_name: 'Kappa',
  name: 'Kappa',
  id: '25',
  url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
  site: 'Twitch Channel',
};

const stvEmotePart: ParsedPart<'emote'> = {
  type: 'emote',
  content: stvGlobalBaseEmote.name,
  original_name: stvGlobalBaseEmote.original_name,
  name: stvGlobalBaseEmote.name,
  id: stvGlobalBaseEmote.id,
  url: stvGlobalBaseEmote.url,
  static_url: stvGlobalBaseEmote.static_url,
  site: stvGlobalBaseEmote.site,
  width: stvGlobalBaseEmote.width,
  height: stvGlobalBaseEmote.height,
  aspect_ratio: stvGlobalBaseEmote.aspect_ratio,
};

const overlaidEmotePart: ParsedPart<'emote'> = {
  ...stvEmotePart,
  overlaid: [
    {
      type: 'emote',
      content: stvGlobalEmote1.name,
      original_name: stvGlobalEmote1.original_name,
      name: stvGlobalEmote1.name,
      id: stvGlobalEmote1.id,
      url: stvGlobalEmote1.url,
      static_url: stvGlobalEmote1.static_url,
      site: stvGlobalEmote1.site,
      width: stvGlobalEmote1.width,
      height: stvGlobalEmote1.height,
      zero_width: true,
    },
  ],
};

const meta = {
  title: 'components/Chat/ChatMessage/EmoteRenderer',
  component: EmoteRenderer,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof EmoteRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwitchEmote: Story = {
  args: {
    part: twitchEmotePart,
  },
};

export const SevenTvEmote: Story = {
  args: {
    part: stvEmotePart,
  },
};

export const ZeroWidthOverlay: Story = {
  args: {
    part: overlaidEmotePart,
  },
};

export const Moderated: Story = {
  args: {
    part: stvEmotePart,
    isModerated: true,
  },
};
