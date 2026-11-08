import { fireEvent, screen } from '@testing-library/react-native';

import { createCategory } from '@app/services/__fixtures__/twitch/category.fixture';
import { createTwitchStream } from '@app/services/__fixtures__/twitch/stream.fixture';
import { twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';

import { TopScreen } from '../TopScreen';

jest.mock('@expo/ui/community/pager-view');

// expo-symbols is faked by the root __mocks__/expo-symbols.ts manual mock.

const getTopStreamsSpy = jest.spyOn(twitchService, 'getTopStreams');
const getTopCategoriesSpy = jest.spyOn(twitchService, 'getTopCategories');

const mockStream = createTwitchStream();

const mockCategory = createCategory({ name: 'Fortnite' });

describe('TopScreen', () => {
  beforeEach(() => {
    getTopStreamsSpy.mockResolvedValue({ data: [mockStream] });
    getTopCategoriesSpy.mockResolvedValue({ data: [mockCategory] });
  });

  test('shows streams by default without fetching the hidden categories scene', async () => {
    render(<TopScreen />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();

    expect(screen.queryByText('Fortnite')).not.toBeOnTheScreen();

    expect(getTopCategoriesSpy).not.toHaveBeenCalled();
  });

  test('switches to categories and back without refetching streams', async () => {
    render(<TopScreen />);

    await screen.findByText('Streamer1');

    fireEvent.press(screen.getByTestId('segmented-control-option-Categories'));

    expect(await screen.findByText('Fortnite')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('segmented-control-option-Streams'));

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();

    expect(getTopStreamsSpy).toHaveBeenCalledTimes(1);

    expect(getTopCategoriesSpy).toHaveBeenCalledTimes(1);
  });

  test('swipes to categories and back without refetching streams', async () => {
    render(<TopScreen />);

    await screen.findByText('Streamer1');

    fireEvent.press(screen.getByTestId('pager-swipe-next'));

    expect(await screen.findByText('Fortnite')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('pager-swipe-prev'));

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();

    expect(getTopStreamsSpy).toHaveBeenCalledTimes(1);

    expect(getTopCategoriesSpy).toHaveBeenCalledTimes(1);
  });

  test('shows the layout menu on streams and hides it on categories', async () => {
    render(<TopScreen />);

    await screen.findByText('Streamer1');

    expect(screen.getByLabelText('Layout')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('segmented-control-option-Categories'));

    expect(screen.queryByLabelText('Layout')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('segmented-control-option-Streams'));

    expect(screen.getByLabelText('Layout')).toBeOnTheScreen();
  });
});
