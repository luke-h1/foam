import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { twitchService as _twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';
import type { TwitchStream } from '@app/types/twitch/stream';

import { LiveStreamCard } from '../live-stream-card/live-stream-card';

const mockStream: TwitchStream = {
  id: '1',
  user_id: '123',
  user_login: 'test_user',
  user_name: 'Test user',
  game_id: '456',
  game_name: 'Just Chatting',
  type: 'live',
  title: 'Test Stream Title',
  viewer_count: 10_000,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  tags: ['stream', 'live', '2024', 'foam'],
  tag_ids: [],
  is_mature: false,
};

describe('LiveStreamCard', () => {
  beforeEach(() => {
    jest
      .spyOn(_twitchService, 'getUserImage')
      .mockResolvedValue('https://example.com/avatar.jpg');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(router.push).mockClear();
  });

  test('pushes the live stream route on press', () => {
    render(<LiveStreamCard stream={mockStream} />);

    fireEvent.press(
      screen.getByLabelText(
        `${mockStream.user_name}, live, ${mockStream.game_name}, 10,000 watching, ${mockStream.title}`,
      ),
    );

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/streams/live-stream/[id]',
      params: { id: mockStream.user_login },
    });
  });

  test('renders correctly', () => {
    render(<LiveStreamCard stream={mockStream} />);

    expect(screen.getByText('Test Stream Title')).toBeOnTheScreen();
    expect(screen.getByText('Test user')).toBeOnTheScreen();
    expect(screen.getByText('10K')).toBeOnTheScreen();
  });

  test('drops the category line when the list is one category', () => {
    render(<LiveStreamCard stream={mockStream} showCategory={false} />);

    expect(
      screen.queryByText(mockStream.game_name, { exact: false }),
    ).not.toBeOnTheScreen();
  });
});
