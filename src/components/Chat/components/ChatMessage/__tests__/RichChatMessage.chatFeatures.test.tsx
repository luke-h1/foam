/* eslint-disable camelcase */
import type { ChatMessageType } from '@app/store/chatStore/constants';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { fireEvent, render } from '@testing-library/react-native';
import { RichChatMessage } from '../RichChatMessage';

jest.mock('@app/utils/date-time/date', () => ({
  formatDate: jest.fn(() => '12:00'),
}));

jest.mock('@app/services/twitch-service');

const createMockMessage = (
  message: ParsedPart[],
  userstate: Partial<UserStateTags> = {},
  overrides: Partial<ChatMessageType<'userstate'>> = {},
): ChatMessageType<'userstate'> => {
  const message_id = 'msg-123';
  const message_nonce = 'nonce-123';
  return {
    id: `${message_id}_${message_nonce}`,
    userstate: {
      username: 'testuser',
      'display-name': 'TestUser',
      login: 'testuser',
      color: '#FF0000',
      'user-id': '123456',
      ...userstate,
    } as UserStateTags,
    message,
    badges: [],
    channel: 'testchannel',
    message_id,
    message_nonce,
    sender: 'testuser',
    replyDisplayName: '',
    replyBody: '',
    ...overrides,
  };
};

describe('RichChatMessage chat features', () => {
  test('calls onUsernamePress when the username is tapped', () => {
    const onUsernamePress = jest.fn();
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const { getByTestId } = render(
      <RichChatMessage {...message} onUsernamePress={onUsernamePress} />,
    );

    fireEvent.press(getByTestId('chat-username-button'));

    expect(onUsernamePress).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        login: 'testuser',
        userId: '123456',
      }),
    );
  });

  test('can hide timestamps when disabled', () => {
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const { queryByText } = render(
      <RichChatMessage {...message} showTimestamp={false} />,
    );

    expect(queryByText('12:00:')).toBeNull();
  });

  test('highlights rows that mention the current user', () => {
    const message = createMockMessage([
      { type: 'mention', content: '@testuser' },
      { type: 'text', content: ' hello' },
    ]);

    const { getByTestId } = render(
      <RichChatMessage {...message} currentUsername="testuser" />,
    );

    expect(getByTestId('chat-message')).toHaveStyle({
      borderLeftWidth: 3,
    });
  });

  test('highlights rows sent by highlighted users', () => {
    const message = createMockMessage([
      { type: 'text', content: 'hello from the highlighted sender' },
    ]);

    const { getByTestId } = render(
      <RichChatMessage {...message} highlightedUsers={['testuser']} />,
    );

    expect(getByTestId('chat-message')).toHaveStyle({
      borderLeftWidth: 2,
    });
  });

  test('renders a denser row in compact mode', () => {
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const { getByTestId } = render(
      <RichChatMessage {...message} density="compact" />,
    );

    expect(getByTestId('chat-message')).toHaveStyle({
      minHeight: 32,
    });
  });

  test('renders viewer milestone events inline without repeating the sender name in the event body', () => {
    const message = createMockMessage([
      {
        type: 'viewermilestone',
        category: 'watch-streak',
        reward: '450',
        value: '5',
        content: '',
        systemMsg:
          'TestUser\\swatched\\s5\\sconsecutive\\sstreams\\sand\\ssparked\\sa\\swatch\\sstreak!',
        login: 'testuser',
        displayName: 'TestUser',
      },
    ]);

    const { getByText, queryByTestId } = render(
      <RichChatMessage {...message} />,
    );

    expect(
      getByText(
        'TestUser watched 5 consecutive streams and sparked a watch streak!',
      ),
    ).toBeOnTheScreen();
    expect(queryByTestId('chat-username-button')).toBeNull();
  });

  test('renders a standalone channel point redemption summary without chat text', () => {
    const message = createMockMessage(
      [],
      {
        'display-name': 'RewardUser',
        username: 'RewardUser',
        login: 'rewarduser',
        'room-id': '67890',
        'custom-reward-id': 'reward-123',
        'msg-param-reward-title': 'Hydrate',
      },
      {
        sender: 'rewarduser',
        isChannelPointRedemption: true,
      },
    );

    const { getByText, queryByTestId } = render(
      <RichChatMessage {...message} />,
    );

    expect(getByText('RewardUser')).toBeOnTheScreen();
    expect(getByText('redeemed')).toBeOnTheScreen();
    expect(getByText('Hydrate')).toBeOnTheScreen();
    expect(queryByTestId('chat-username-button')).toBeNull();
  });
});
