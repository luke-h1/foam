import { screen } from '@testing-library/react-native';

import { CategoryScreen } from '@app/screens/CategoryScreen';
import { twitchService as _twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';

jest.mock('@app/services/twitch-service');

const twitchService = jest.mocked(_twitchService);

const mockCategory = {
  id: 'cat1',
  name: 'Just Chatting',
  box_art_url: 'https://example.com/art-{width}x{height}.jpg',
};

const mockStream = {
  id: '1',
  user_id: '100',
  user_login: 'streamer1',
  user_name: 'Streamer1',
  game_id: 'cat1',
  game_name: 'Just Chatting',
  type: 'live' as const,
  title: 'Test stream',
  viewer_count: 10000,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: '',
  tag_ids: [],
  tags: [],
  is_mature: false,
};

describe('CategoryScreen', () => {
  beforeEach(() => {
    twitchService.getUserImage.mockResolvedValue(
      'https://example.com/avatar.jpg',
    );
  });

  test('shows loading state while category or streams are loading', () => {
    twitchService.getCategory.mockReturnValue(new Promise(() => {}));
    twitchService.getStreamsByCategory.mockReturnValue(new Promise(() => {}));

    render(<CategoryScreen id='cat1' />);

    expect(screen.getByTestId('loading-state')).toBeOnTheScreen();
  });

  test('shows error empty state when category fetch fails', async () => {
    twitchService.getCategory.mockRejectedValue(new Error('network error'));
    twitchService.getStreamsByCategory.mockResolvedValue({ data: [] });

    render(<CategoryScreen id='cat1' />);

    expect(
      await screen.findByText('Failed to fetch categories'),
    ).toBeOnTheScreen();
  });

  test('shows error empty state when streams fetch fails', async () => {
    twitchService.getCategory.mockResolvedValue(mockCategory);
    twitchService.getStreamsByCategory.mockRejectedValue(
      new Error('network error'),
    );

    render(<CategoryScreen id='cat1' />);

    expect(
      await screen.findByText('Failed to fetch categories'),
    ).toBeOnTheScreen();
  });

  test('renders category name and streams when data is available', async () => {
    twitchService.getCategory.mockResolvedValue(mockCategory);
    twitchService.getStreamsByCategory.mockResolvedValue({
      data: [mockStream],
    });

    render(<CategoryScreen id='cat1' />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();
    expect(screen.getByText('10,000 viewers')).toBeOnTheScreen();
    expect(screen.getAllByText('Just Chatting').length).toBeGreaterThan(0);
  });

  test('shows empty state when no streams for category', async () => {
    twitchService.getCategory.mockResolvedValue(mockCategory);
    twitchService.getStreamsByCategory.mockResolvedValue({ data: [] });

    render(<CategoryScreen id='cat1' />);

    expect(await screen.findByText('No Top Streams found')).toBeOnTheScreen();
  });
});
