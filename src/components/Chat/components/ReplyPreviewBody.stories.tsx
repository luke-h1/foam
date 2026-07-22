import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { stvGlobalBaseEmote } from './ChatMessage/richChatMessageStoryFixtures';
import { ReplyPreviewBody } from './ReplyPreviewBody';

const emotePart: ParsedPart = {
  type: 'emote',
  content: stvGlobalBaseEmote.name,
  id: stvGlobalBaseEmote.id,
  name: stvGlobalBaseEmote.name,
  url: stvGlobalBaseEmote.url,
  static_url: stvGlobalBaseEmote.static_url,
  site: stvGlobalBaseEmote.site,
};

const meta = {
  title: 'components/Chat/ReplyPreviewBody',
  component: ReplyPreviewBody,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ReplyPreviewBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextOnly: Story = {
  args: {
    parts: [{ type: 'text', content: 'replying to a plain text message' }],
    textStyle: { color: '#ADADB8', fontSize: 13 },
  },
};

export const WithEmotes: Story = {
  args: {
    parts: [
      { type: 'text', content: 'that clutch was insane ' },
      emotePart,
      emotePart,
    ],
    textStyle: { color: '#ADADB8', fontSize: 13 },
  },
};
