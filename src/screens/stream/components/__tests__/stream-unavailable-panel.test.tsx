import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { StreamUnavailablePanel } from '../stream-unavailable-panel';

describe('StreamUnavailablePanel', () => {
  test('names the channel and routes to its profile when offline', () => {
    render(
      <StreamUnavailablePanel
        channelLogin='streamer1'
        displayName='Streamer1'
        onRetry={jest.fn()}
        profileImageUrl='https://example.com/avatar.png'
        reason='offline'
      />,
    );

    expect(screen.getByText('Streamer1 is offline')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('Videos and clips'));

    expect(router.push).toHaveBeenCalledWith(
      '/streams/streamer-profile/streamer1',
    );
  });

  test('falls back to the login when no display name has loaded', () => {
    render(
      <StreamUnavailablePanel
        channelLogin='streamer1'
        onRetry={jest.fn()}
        reason='offline'
      />,
    );

    expect(screen.getByText('streamer1 is offline')).toBeOnTheScreen();
  });

  test('offers retry when the stream request failed', () => {
    const onRetry = jest.fn();

    render(
      <StreamUnavailablePanel
        channelLogin='streamer1'
        displayName='Streamer1'
        onRetry={onRetry}
        reason='error'
      />,
    );

    expect(screen.getByText("Couldn't load this stream")).toBeOnTheScreen();

    fireEvent.press(screen.getByText('Try again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
