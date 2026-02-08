import {
  twitchService as _twitchService,
  TwitchStream,
} from '@app/services/twitch-service';
import render from '@app/test/render';
import { NavigationContainer } from '@react-navigation/native';
import { screen } from '@testing-library/react-native';
import { LiveStreamCard } from '../LiveStreamCard/LiveStreamCard';

const mockStream: TwitchStream = {
  id: '1',
  user_id: '123',
  user_login: 'test_user',
  user_name: 'Test user',
  game_id: '456',
  game_name: 'Just Chatting',
  type: 'live',
  title: 'Test Stream Title',
  viewer_count: 10000,
  started_at: new Date().toISOString(),
  language: 'en',
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  tags: ['stream', 'live', '2024', 'foam'],
  tag_ids: [],
  is_mature: false,
};

jest.mock('@app/services/twitch-service');

const twitchService = jest.mocked(_twitchService);

describe('LiveStreamCard', () => {
  beforeEach(() => {
    twitchService.getUserImage.mockResolvedValue(
      'https://example.com/avatar.jpg',
    );
  });

  test('renders correctly', () => {
    render(<LiveStreamCard stream={mockStream} />, {
      wrapper: NavigationContainer,
    });

    expect(screen.getByText('Test Stream Title')).toBeOnTheScreen();
    expect(screen.getByText('Test user')).toBeOnTheScreen();
    expect(screen.getByText('10,000')).toBeOnTheScreen();
  });
});
