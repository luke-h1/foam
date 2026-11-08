import { screen } from '@testing-library/react-native';

import { createTwitchStream } from '@app/services/__fixtures__/twitch/stream.fixture';
import { twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';

import { TopStreamsScreen } from '../TopStreamsScreen';

// expo-symbols is faked by the root __mocks__/expo-symbols.ts manual mock.

const getTopStreamsSpy = jest.spyOn(twitchService, 'getTopStreams');

const mockStream = createTwitchStream();

describe('TopStreamsScreen', () => {
  test('shows loading skeletons while fetching', () => {
    getTopStreamsSpy.mockReturnValue(new Promise(() => {}));

    render(<TopStreamsScreen />);

    expect(screen.getAllByTestId('stream-skeleton')[0]).toBeOnTheScreen();
  });

  test('shows empty state when no streams returned', async () => {
    getTopStreamsSpy.mockResolvedValue({ data: [] });

    render(<TopStreamsScreen />);

    expect(await screen.findByText('No streams right now')).toBeOnTheScreen();
  });

  test('shows error state when the fetch fails', async () => {
    getTopStreamsSpy.mockRejectedValue(new Error('network error'));

    render(<TopStreamsScreen />);

    expect(
      await screen.findByText("Couldn't load top streams"),
    ).toBeOnTheScreen();
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
