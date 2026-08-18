import { screen } from '@testing-library/react-native';

import { twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { TwitchStream } from '@app/types/twitch/stream';

import { TopStreamsScreen } from '../TopStreamsScreen';

// expo-symbols is faked by the root __mocks__/expo-symbols.ts manual mock.

const getTopStreamsSpy = jest.spyOn(twitchService, 'getTopStreams');
const getUserImageSpy = jest.spyOn(twitchService, 'getUserImage');

const mockStream: TwitchStream = {
  id: '1',
  user_id: '100',
  user_login: 'streamer1',
  user_name: 'Streamer1',
  game_id: '509658',
  game_name: 'Just Chatting',
  type: 'live' as const,
  title: 'Test stream',
  viewer_count: 10000,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: 'https://example.com/thumb.jpg',
  tag_ids: [],
  tags: [],
  is_mature: false,
};

describe('TopStreamsScreen', () => {
  beforeEach(() => {
    getUserImageSpy.mockResolvedValue('https://example.com/avatar.jpg');
  });

  test('shows loading skeletons while fetching', () => {
    getTopStreamsSpy.mockReturnValue(new Promise(() => {}));

    render(<TopStreamsScreen />);

    expect(screen.getAllByTestId('stream-skeleton').length).toBeGreaterThan(0);
  });

  test('renders stream list when data is available', async () => {
    getTopStreamsSpy.mockResolvedValue({ data: [mockStream] });

    render(<TopStreamsScreen />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();
  });

  test('shows empty state when no streams returned', async () => {
    getTopStreamsSpy.mockResolvedValue({ data: [] });

    render(<TopStreamsScreen />);

    expect(await screen.findByText('No Top Streams found')).toBeOnTheScreen();
  });

  test('shows empty state when the fetch fails', async () => {
    getTopStreamsSpy.mockRejectedValue(new Error('network error'));

    render(<TopStreamsScreen />);

    expect(await screen.findByText('No Top Streams found')).toBeOnTheScreen();
  });

  test('renders multiple streams', async () => {
    getTopStreamsSpy.mockResolvedValue({
      data: [mockStream, { ...mockStream, id: '2', user_name: 'Streamer2' }],
    });

    render(<TopStreamsScreen />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();
    expect(screen.getByText('Streamer2')).toBeOnTheScreen();
  });
});
