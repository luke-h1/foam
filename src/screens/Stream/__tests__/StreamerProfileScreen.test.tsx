import { fireEvent, screen } from '@testing-library/react-native';

import { StreamerProfileScreen } from '@app/screens/Stream/StreamerProfileScreen';
import { streamElementsService as _streamElementsService } from '@app/services/streamelements-service';
import { twitchService as _twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { StreamElementsChatStats } from '@app/types/streamelements/stats';
import type { TwitchClip } from '@app/types/twitch/clip';
import type { UserInfoResponse } from '@app/types/twitch/user';
import type { TwitchVideo } from '@app/types/twitch/video';

jest.mock('@app/services/twitch-service');
jest.mock('@app/services/streamelements-service');
jest.mock('@app/hooks/useScrollToTop', () => ({ useScrollToTop: jest.fn() }));

// SegmentedControl wraps the native @expo/ui control, which cannot receive
// segment-change events in tests; expose each segment as a pressable instead.
jest.mock('@app/components/SegmentedControl/SegmentedControl', () => ({
  SegmentedControl: ({
    items,
    onChange,
  }: {
    items: { label: string }[];
    onChange: (index: number) => void;
  }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      View,
      null,
      items.map(({ label }: { label: string }, i: number) =>
        React.createElement(
          TouchableOpacity,
          {
            key: label,
            testID: `tab-${label.toLowerCase()}`,
            onPress: () => onChange(i),
          },
          React.createElement(Text, null, label),
        ),
      ),
    );
  },
}));

const twitchService = jest.mocked(_twitchService);
const streamElementsService = jest.mocked(_streamElementsService);

const mockUser: UserInfoResponse = {
  id: '123',
  login: 'shroud',
  display_name: 'shroud',
  description: 'pro gamer',
  profile_image_url: 'https://example.com/avatar.jpg',
  offline_image_url: 'https://example.com/offline.jpg',
  broadcaster_type: 'partner',
  created_at: '2015-01-01T00:00:00Z',
  type: '',
  view_count: 0,
};

const mockVideo: TwitchVideo = {
  id: 'v1',
  stream_id: 's1',
  user_id: '123',
  user_login: 'shroud',
  user_name: 'shroud',
  title: 'Epic Broadcast',
  description: '',
  created_at: '2026-06-10T00:00:00Z',
  published_at: '2026-06-10T00:00:00Z',
  url: 'https://twitch.tv/videos/v1',
  thumbnail_url: 'https://example.com/vod-%{width}x%{height}.jpg',
  viewable: 'public',
  view_count: 12345,
  language: 'en',
  type: 'archive',
  duration: '1h2m3s',
  muted_segments: null,
};

const mockClip: TwitchClip = {
  id: 'c1',
  url: 'https://clips.twitch.tv/c1',
  embed_url: 'https://clips.twitch.tv/embed?clip=c1',
  broadcaster_id: '123',
  broadcaster_name: 'shroud',
  creator_id: '999',
  creator_name: 'Clipper',
  video_id: '',
  game_id: '',
  language: 'en',
  title: 'Funny Clip',
  view_count: 500,
  created_at: '2026-06-01T00:00:00Z',
  thumbnail_url: 'https://example.com/clip-preview-480x272.jpg',
  duration: 30,
  vod_offset: 0,
  is_featured: false,
};

const mockChatStats: StreamElementsChatStats = {
  channel: 'shroud',
  totalMessages: 69134962,
  uniqueChatters: 118560,
  chatters: [],
  twitchEmotes: [{ id: '1', emote: 'LUL', amount: 100 }],
  bttvEmotes: [],
  ffzEmotes: [],
  sevenTVEmotes: [{ id: '2', emote: 'OMEGALUL', amount: 9999 }],
};

describe('StreamerProfileScreen', () => {
  beforeEach(() => {
    twitchService.getUser.mockResolvedValue(mockUser);
    twitchService.getClips.mockResolvedValue({ data: [mockClip] });
    twitchService.getVideos.mockResolvedValue({ data: [mockVideo] });
    // Most channels have no StreamElements account; default to "no data".
    streamElementsService.getChatStats.mockRejectedValue(new Error('404'));
  });

  test('renders the profile and VODs by default', async () => {
    render(<StreamerProfileScreen id='shroud' />);

    expect(
      await screen.findByText('Epic Broadcast', {}, { timeout: 5000 }),
    ).toBeOnTheScreen();
    expect(screen.getByText('shroud')).toBeOnTheScreen();
    expect(screen.getByText('@shroud')).toBeOnTheScreen();
    // VOD duration "1h2m3s" formatted as h:mm:ss
    expect(screen.getByText('1:02:03')).toBeOnTheScreen();
  });

  test('switches to clips when the Clips tab is selected', async () => {
    render(<StreamerProfileScreen id='shroud' />);

    await screen.findByText('Epic Broadcast');

    fireEvent.press(screen.getByTestId('tab-clips'));

    expect(await screen.findByText('Funny Clip')).toBeOnTheScreen();
    expect(screen.getByText('Clipped by Clipper')).toBeOnTheScreen();
  });

  test('shows StreamElements stats when available', async () => {
    streamElementsService.getChatStats.mockResolvedValue(mockChatStats);

    render(<StreamerProfileScreen id='shroud' />);

    expect(await screen.findByText('via StreamElements')).toBeOnTheScreen();
    // Top emote across all platforms is the highest-count one.
    expect(screen.getByText('OMEGALUL')).toBeOnTheScreen();
  });

  test('hides StreamElements stats when unavailable', async () => {
    render(<StreamerProfileScreen id='shroud' />);

    await screen.findByText('Epic Broadcast');

    expect(screen.queryByText('via StreamElements')).not.toBeOnTheScreen();
  });

  test('shows an empty state when the channel has no VODs', async () => {
    twitchService.getVideos.mockResolvedValue({ data: [] });

    render(<StreamerProfileScreen id='shroud' />);

    expect(await screen.findByText('No VODs found')).toBeOnTheScreen();
  });

  test('shows a not-found state when the user fails to load', async () => {
    twitchService.getUser.mockRejectedValue(new Error('network error'));

    render(<StreamerProfileScreen id='shroud' />);

    expect(await screen.findByText('Streamer not found')).toBeOnTheScreen();
  });
});
