import { screen } from '@testing-library/react-native';

import { CategoryScreen } from '@app/screens/category/CategoryScreen';
import { createCategory } from '@app/services/__fixtures__/twitch/category.fixture';
import { createTwitchStream } from '@app/services/__fixtures__/twitch/stream.fixture';
import { twitchService as realTwitchService } from '@app/services/twitch-service';
import render from '@app/test/render';

const twitchService = {
  getCategory: jest.spyOn(realTwitchService, 'getCategory'),
  getStreamsByCategory: jest.spyOn(realTwitchService, 'getStreamsByCategory'),
};

const mockCategory = createCategory();

const mockStream = createTwitchStream({ game_id: 'cat1', thumbnail_url: '' });

describe('CategoryScreen', () => {
  test('shows loading state while category or streams are loading', () => {
    twitchService.getCategory.mockReturnValue(new Promise(() => {}));
    twitchService.getStreamsByCategory.mockReturnValue(new Promise(() => {}));

    render(<CategoryScreen id='cat1' />);

    expect(screen.getAllByTestId('stream-skeleton')[0]).toBeOnTheScreen();
  });

  test('shows error empty state when category fetch fails', async () => {
    twitchService.getCategory.mockRejectedValue(new Error('network error'));
    twitchService.getStreamsByCategory.mockResolvedValue({ data: [] });

    render(<CategoryScreen id='cat1' />);

    expect(
      await screen.findByText("Couldn't load this category"),
    ).toBeOnTheScreen();
  });

  test('shows not found when the category id is unknown', async () => {
    twitchService.getCategory.mockResolvedValue(null);
    twitchService.getStreamsByCategory.mockResolvedValue({ data: [] });

    render(<CategoryScreen id='cat1' />);

    expect(await screen.findByText('Category not found')).toBeOnTheScreen();
  });

  test('shows error empty state when streams fetch fails', async () => {
    twitchService.getCategory.mockResolvedValue(mockCategory);

    twitchService.getStreamsByCategory.mockRejectedValue(
      new Error('network error'),
    );

    render(<CategoryScreen id='cat1' />);

    expect(
      await screen.findByText("Couldn't load this category"),
    ).toBeOnTheScreen();
  });

  test('renders category name and streams when data is available', async () => {
    twitchService.getCategory.mockResolvedValue(mockCategory);

    twitchService.getStreamsByCategory.mockResolvedValue({
      data: [mockStream],
    });

    render(<CategoryScreen id='cat1' />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();

    expect(screen.getByText('10,000 watching')).toBeOnTheScreen();

    expect(screen.getByText('Just Chatting')).toBeOnTheScreen();
  });

  test('shows empty state when no streams for category', async () => {
    twitchService.getCategory.mockResolvedValue(mockCategory);
    twitchService.getStreamsByCategory.mockResolvedValue({ data: [] });

    render(<CategoryScreen id='cat1' />);

    expect(await screen.findByText('Nobody is live')).toBeOnTheScreen();
  });
});
