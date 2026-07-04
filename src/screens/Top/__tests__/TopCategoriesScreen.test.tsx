import { screen } from '@testing-library/react-native';

import { twitchService as _twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { Category } from '@app/types/twitch/category';

import { TopCategoriesScreen } from '../TopCategoriesScreen';

jest.mock('@app/services/twitch-service');

const twitchService = jest.mocked(_twitchService);

const mockCategory: Category = {
  id: 'cat1',
  name: 'Just Chatting',
  box_art_url: 'https://example.com/art-{width}x{height}.jpg',
};

describe('TopCategoriesScreen', () => {
  test('shows skeleton while loading', () => {
    twitchService.getTopCategories.mockReturnValue(new Promise(() => {}));

    render(<TopCategoriesScreen />);

    expect(screen.getAllByTestId('category-skeleton').length).toBeGreaterThan(
      0,
    );
  });

  test('renders category list when data is available', async () => {
    twitchService.getTopCategories.mockResolvedValue({
      data: [mockCategory],
    });

    render(<TopCategoriesScreen />);

    expect(await screen.findByText('Just Chatting')).toBeOnTheScreen();
  });

  test('shows error empty state when fetch fails', async () => {
    twitchService.getTopCategories.mockRejectedValue(
      new Error('network error'),
    );

    render(<TopCategoriesScreen />);

    expect(
      await screen.findByText('Failed to fetch top categories'),
    ).toBeOnTheScreen();
  });

  test('shows empty state when no categories returned', async () => {
    twitchService.getTopCategories.mockResolvedValue({ data: [] });

    render(<TopCategoriesScreen />);

    expect(await screen.findByText('No categories found')).toBeOnTheScreen();
  });

  test('renders multiple categories', async () => {
    twitchService.getTopCategories.mockResolvedValue({
      data: [mockCategory, { id: 'cat2', name: 'Fortnite', box_art_url: '' }],
    });

    render(<TopCategoriesScreen />);

    expect(await screen.findByText('Just Chatting')).toBeOnTheScreen();
    expect(screen.getByText('Fortnite')).toBeOnTheScreen();
  });
});
