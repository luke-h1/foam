import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { stvGlobalBaseEmote } from '../ChatMessage/richChatMessageStoryFixtures';
import { MessageActionPreview } from './MessageActionPreview';

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
  title: 'components/Chat/ActionSheet/MessageActionPreview',
  component: MessageActionPreview,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof MessageActionPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextOnly: Story = {
  args: {
    username: 'TestUser',
    message: [{ type: 'text', content: 'just a plain chat message' }],
  },
};

export const WithEmote: Story = {
  args: {
    username: 'TestUser',
    message: [
      { type: 'text', content: 'check this out ' },
      emotePart,
      { type: 'text', content: ' amazing' },
    ],
  },
};

export const WithMention: Story = {
  args: {
    username: 'TestUser',
    message: [
      { type: 'mention', content: '@someone' },
      { type: 'text', content: ' welcome to the stream' },
    ],
  },
};
