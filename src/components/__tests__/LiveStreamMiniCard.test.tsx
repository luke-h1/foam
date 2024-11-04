import { SearchChannelResponse } from '@app/services/twitchService';
import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import LiveStreamMiniCard from '../LiveStreamMiniCard';

// Mock the useNavigation hook
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

const mockStream: SearchChannelResponse = {
  id: '1',
  game_id: '456',
  game_name: 'Just Chatting',
  title: 'Test Stream Title',
  started_at: new Date().toISOString(),
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  tags: ['stream', 'live', '2024', 'foam'],
  tag_ids: [],
  broadcaster_language: 'en',
  broadcaster_login: 'test_user',
  display_name: 'Test user',
  is_live: true,
};

const notLiveStream: SearchChannelResponse = {
  ...mockStream,
  is_live: false,
  game_name: undefined as unknown as string,
  title: undefined as unknown as string,
};

describe('LiveStreamMiniCard', () => {
  test('renders correctly when stream is live and has a title', () => {
    render(<LiveStreamMiniCard stream={mockStream} />);
    expect(screen.getByText('Test Stream Title')).toBeOnTheScreen();
    expect(screen.getByText('Just Chatting')).toBeOnTheScreen();
    expect(screen.getByTestId('LiveStreamImage-image')).toBeOnTheScreen();
  });

  test('renders correctly when stream is not live and has no title', () => {
    render(<LiveStreamMiniCard stream={notLiveStream} />);
    expect(screen.queryByText('Test Stream Title')).not.toBeOnTheScreen();
    expect(screen.getByText(notLiveStream.broadcaster_login)).toBeOnTheScreen();
    expect(screen.queryByText('Just Chatting')).not.toBeOnTheScreen();
    expect(screen.getByTestId('LiveStreamImage-image')).toBeOnTheScreen();
  });
});
