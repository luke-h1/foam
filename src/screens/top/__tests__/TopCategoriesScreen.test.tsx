import { screen } from '@testing-library/react-native';

import { createCategory } from '@app/services/__fixtures__/twitch/category.fixture';
import { twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';

import { TopCategoriesScreen } from '../TopCategoriesScreen';

const getTopCategoriesSpy = jest.spyOn(twitchService, 'getTopCategories');

const mockCategory = createCategory();

describe('TopCategoriesScreen', () => {
  test('shows skeleton while loading', () => {
    getTopCategoriesSpy.mockReturnValue(new Promise(() => {}));

    render(<TopCategoriesScreen />);

    expect(screen.getAllByTestId('category-skeleton')[0]).toBeOnTheScreen();
  });

  test('shows error empty state when fetch fails', async () => {
    getTopCategoriesSpy.mockRejectedValue(new Error('network error'));

    render(<TopCategoriesScreen />);

    expect(
      await screen.findByText("Couldn't load categories"),
    ).toBeOnTheScreen();
  });

  test('shows empty state when no categories returned', async () => {
    getTopCategoriesSpy.mockResolvedValue({ data: [] });

    render(<TopCategoriesScreen />);

    expect(
      await screen.findByText('No categories right now'),
    ).toBeOnTheScreen();
  });

  test('renders multiple categories', async () => {
    getTopCategoriesSpy.mockResolvedValue({
      data: [
        mockCategory,
        createCategory({ id: 'cat2', name: 'Fortnite', box_art_url: '' }),
      ],
    });

    render(<TopCategoriesScreen />);

    expect(await screen.findByText('Just Chatting')).toBeOnTheScreen();

    expect(screen.getByText('Fortnite')).toBeOnTheScreen();
  });
});
