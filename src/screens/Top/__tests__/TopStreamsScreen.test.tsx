import { screen } from '@testing-library/react-native';

import { twitchService as _twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';

import { TopStreamsScreen } from '../TopStreamsScreen';

jest.mock('@app/services/twitch-service');
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

const twitchService = jest.mocked(_twitchService);

const mockStream = {
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
    twitchService.getUserImage.mockResolvedValue(
      'https://example.com/avatar.jpg',
    );
  });

  test('shows loading skeletons while fetching', () => {
    twitchService.getTopStreams.mockReturnValue(new Promise(() => {}));

    render(<TopStreamsScreen />);

    expect(screen.getAllByTestId('stream-skeleton').length).toBeGreaterThan(0);
  });

  test('renders stream list when data is available', async () => {
    twitchService.getTopStreams.mockResolvedValue({ data: [mockStream] });

    render(<TopStreamsScreen />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();
  });

  test('shows empty state when no streams returned', async () => {
    twitchService.getTopStreams.mockResolvedValue({ data: [] });

    render(<TopStreamsScreen />);

    expect(await screen.findByText('No Top Streams found')).toBeOnTheScreen();
  });

  test('shows empty state when the fetch fails', async () => {
    twitchService.getTopStreams.mockRejectedValue(new Error('network error'));

    render(<TopStreamsScreen />);

    expect(await screen.findByText('No Top Streams found')).toBeOnTheScreen();
  });

  test('renders multiple streams', async () => {
    twitchService.getTopStreams.mockResolvedValue({
      data: [mockStream, { ...mockStream, id: '2', user_name: 'Streamer2' }],
    });

    render(<TopStreamsScreen />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();
    expect(screen.getByText('Streamer2')).toBeOnTheScreen();
  });
});
