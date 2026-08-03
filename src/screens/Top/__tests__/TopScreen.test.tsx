import { fireEvent, screen } from '@testing-library/react-native';

import { twitchService as _twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { Category } from '@app/types/twitch/category';
import type { TwitchStream } from '@app/types/twitch/stream';

import { TopScreen } from '../TopScreen';

jest.mock('@app/services/twitch-service');
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
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
            testID: `segment-${label.toLowerCase()}`,
            onPress: () => onChange(i),
          },
          React.createElement(Text, null, label),
        ),
      ),
    );
  },
}));

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
} satisfies TwitchStream;

const mockCategory = {
  id: 'cat1',
  name: 'Fortnite',
  box_art_url: 'https://example.com/art-{width}x{height}.jpg',
} satisfies Category;

describe('TopScreen', () => {
  beforeEach(() => {
    twitchService.getTopStreams.mockResolvedValue({ data: [mockStream] });
    twitchService.getTopCategories.mockResolvedValue({ data: [mockCategory] });
    twitchService.getUserImage.mockResolvedValue(
      'https://example.com/avatar.jpg',
    );
  });

  test('shows streams by default without fetching the hidden categories scene', async () => {
    render(<TopScreen />);

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();
    expect(screen.queryByText('Fortnite')).not.toBeOnTheScreen();
    expect(twitchService.getTopCategories).not.toHaveBeenCalled();
  });

  test('switches to categories and back without refetching streams', async () => {
    render(<TopScreen />);

    await screen.findByText('Streamer1');

    fireEvent.press(screen.getByTestId('segment-categories'));

    expect(await screen.findByText('Fortnite')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('segment-streams'));

    expect(await screen.findByText('Streamer1')).toBeOnTheScreen();
    expect(twitchService.getTopStreams).toHaveBeenCalledTimes(1);
    expect(twitchService.getTopCategories).toHaveBeenCalledTimes(1);
  });
});
