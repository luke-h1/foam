import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { SevenTvEmotePreview } from '@app/types/seventv/emotes';
import type { TwitchClip } from '@app/types/twitch/clip';

import { MediaLinkCard } from './MediaLinkCard';

const clipUrl = 'https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage';
const emoteUrl = 'https://7tv.app/emotes/01FCY771D800007PQ2DF3GDTN6';

const clipFixture = {
  id: 'AwkwardHelplessSalamanderSwiftRage',
  url: clipUrl,
  embed_url:
    'https://clips.twitch.tv/embed?clip=AwkwardHelplessSalamanderSwiftRage',
  broadcaster_id: '100',
  broadcaster_name: 'StreamerMain',
  creator_id: '101',
  creator_name: 'ClipperFan',
  video_id: '1234567890',
  game_id: '509658',
  language: 'en',
  title: 'Unbelievable pentakill in the last second',
  view_count: 128000,
  created_at: '2026-07-01T18:30:00Z',
  thumbnail_url: 'https://placecats.com/352/198',
  duration: 28.5,
  vod_offset: 4120,
  is_featured: true,
} satisfies TwitchClip;

const emotePreviewFixture = {
  id: '01FCY771D800007PQ2DF3GDTN6',
  name: 'RainTime',
  owner: {
    display_name: 'eternal_pestilence',
    username: 'eternal_pestilence',
  },
} satisfies SevenTvEmotePreview;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

queryClient.setQueryData(['twitchClip', clipUrl], clipFixture);
queryClient.setQueryData(['sevenTvEmote', emoteUrl], emotePreviewFixture);

const meta = {
  title: 'components/Chat/MediaLinkCard',
  component: MediaLinkCard,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
          <Story />
        </View>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof MediaLinkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwitchClipCard: Story = {
  args: {
    type: 'twitchClip',
    url: clipUrl,
  },
};

export const SevenTvEmoteCard: Story = {
  args: {
    type: 'stvEmote',
    url: emoteUrl,
  },
};

export const SevenTvEmoteInline: Story = {
  args: {
    type: 'stvEmote',
    url: emoteUrl,
    layout: 'inline',
  },
};
