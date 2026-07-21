import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import {
  premiumBadge,
  stvGlobalBaseEmote,
} from '../richChatMessageStoryFixtures';
import { ChatInlineImage } from './ChatInlineImage';

const meta = {
  title: 'components/Chat/ChatMessage/ChatInlineImage',
  component: ChatInlineImage,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ChatInlineImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwitchEmote: Story = {
  args: {
    sourceUrl: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
    style: { height: 30, width: 30 },
  },
};

export const SevenTvEmote: Story = {
  args: {
    sourceUrl: stvGlobalBaseEmote.url,
    style: { height: 30, width: 30 },
  },
};

export const Badge: Story = {
  args: {
    sourceUrl: premiumBadge.url,
    style: { height: 18, width: 18 },
    maxRetryAttempts: 0,
    showLoadingShimmer: false,
  },
};

export const BrokenUrl: Story = {
  args: {
    sourceUrl: 'https://static-cdn.jtvnw.net/emoticons/v2/does-not-exist/1.0',
    style: { height: 30, width: 30 },
    maxRetryAttempts: 0,
  },
};
