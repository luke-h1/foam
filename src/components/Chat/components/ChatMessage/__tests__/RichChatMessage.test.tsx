/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable camelcase */
import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import { theme } from '@app/styles/themes';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { act, render, fireEvent } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { RichChatMessage } from '../RichChatMessage';

jest.mock('@app/utils/date-time/date', () => ({
  formatDate: jest.fn(() => '12:00'),
}));

jest.mock('@app/services/twitch-service');

jest.mock('../renderers/EmoteRenderer', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest mock factory must not reference outer scope
  const { Text, View } = require('react-native');
  return {
    EmoteRenderer: ({
      part,
      disableAnimations,
      shouldOverlayPrevious,
    }: {
      part: { name?: string };
      disableAnimations?: boolean;
      shouldOverlayPrevious?: boolean;
    }) => (
      <View
        testID={disableAnimations ? 'emote-renderer-static' : 'emote-renderer'}
      >
        <Text>
          {part?.name ?? 'emote'}
          {shouldOverlayPrevious ? ':overlay' : ''}
        </Text>
      </View>
    ),
  };
});

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

const MESSAGE_LONG_PRESS_DELAY_MS = 650;

function fireMessageLongPress(element: ReactTestInstance) {
  jest.useFakeTimers();
  fireEvent(element, 'touchStart');
  act(() => {
    jest.advanceTimersByTime(MESSAGE_LONG_PRESS_DELAY_MS);
  });
  fireEvent(element, 'touchEnd');
  jest.useRealTimers();
}

describe('RichChatMessage', () => {
  const mockOnReply = jest.fn();
  const mockOnMessageLongPress = jest.fn();
  const mockOnEmotePress = jest.fn();
  const mockOnReplyContextPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('coalesces adjacent text parts into one rendered text node', () => {
    const message = createMockMessage([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'world' },
    ]);

    const { getByText, queryByText } = render(<RichChatMessage {...message} />);

    expect(getByText('Hello world')).toBeOnTheScreen();

    expect(queryByText('Hello')).toBeNull();
    expect(queryByText('world')).toBeNull();
  });

  test('does not render object placeholders for malformed text parts', () => {
    const malformedMessage = [
      { type: 'text', content: { text: 'bad payload' } },
    ] as unknown as ParsedPart[];
    const message = createMockMessage(malformedMessage);

    const { queryByText } = render(<RichChatMessage {...message} />);

    expect(queryByText('[object Object]')).toBeNull();
  });

  test('reserves blank badge slots without rendering blank text bars', () => {
    const message = createMockMessage(
      [{ type: 'text', content: '' }],
      {},
      {
        badges: [
          {
            id: 'cold-badge',
            owner_username: 'testuser',
            set: 'cold',
            title: 'Cold Badge',
            type: 'badge',
            url: '',
          },
        ],
      },
    );

    const { getByTestId, queryByTestId } = render(
      <RichChatMessage {...message} />,
    );

    expect(getByTestId('chat-badge-placeholder')).toBeOnTheScreen();
    expect(queryByTestId('chat-text-placeholder')).toBeNull();
  });

  describe('Long Press Reply', () => {
    test('should call onReply when message is long pressed (regular messages)', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).toHaveBeenCalledTimes(1);

      const replyMessage = mockOnReply.mock.calls[0]?.[0];

      expect({
        color: replyMessage?.userstate.color,
        message_id: replyMessage?.message_id,
        sender: replyMessage?.sender,
        username: replyMessage?.userstate.username,
      }).toEqual({
        color: '#FF0000',
        message_id: 'msg-123',
        sender: 'testuser',
        username: 'testuser',
      });
    });

    test('should NOT call onReply when system messages (STV emote added) are long pressed', () => {
      const message = createMockMessage([
        {
          type: 'stv_emote_added',
          stvEvents: {
            type: 'added',
            data: {
              id: '123',
              name: 'TestEmote',
              url: 'https://example.com/emote.png',
              original_name: 'TestEmote',
              site: '7TV Channel',
              creator: null,
              emote_link: '',
              frame_count: 1,
              format: 'avif',
              flags: 0,
              aspect_ratio: 1,
              zero_width: false,
              width: 128,
              height: 128,
              set_metadata: {
                setId: '',
                setName: '',
                capacity: null,
                ownerId: null,
                kind: 'NORMAL' as EmoteSetKind,
                updatedAt: '',
                totalCount: 0,
              },
            },
          },
        },
      ]);

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when system messages (STV emote removed) are long pressed', () => {
      const message = createMockMessage([
        {
          type: 'stv_emote_removed',
          stvEvents: {
            type: 'removed',
            data: {
              id: '123',
              name: 'TestEmote',
              url: 'https://example.com/emote.png',
              original_name: 'TestEmote',
              site: '7TV Channel',
              creator: null,
              emote_link: '',
              frame_count: 1,
              format: 'avif',
              flags: 0,
              aspect_ratio: 1,
              zero_width: false,
              width: 128,
              height: 128,
              set_metadata: {
                setId: '',
                setName: '',
                capacity: null,
                ownerId: null,
                kind: 'NORMAL' as EmoteSetKind,
                updatedAt: '',
                totalCount: 0,
              },
            },
          },
        },
      ]);

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when subscription notices are long pressed', () => {
      const message = createMockMessage([
        {
          type: 'sub',
          subscriptionEvent: {
            msgId: 'sub',
            displayName: 'NewSubscriber',
            message: 'Thanks for subscribing!',
            plan: '1000',
            planName: 'Tier 1',
            months: 1,
          },
        },
      ]);

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when resub notices are long pressed', () => {
      const message = createMockMessage([
        {
          type: 'resub',
          subscriptionEvent: {
            msgId: 'resub',
            displayName: 'LoyalSubscriber',
            message: 'Keep up the great content!',
            plan: '2000',
            planName: 'Tier 2',
            months: 12,
          },
        },
      ]);

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when messages without username are long pressed', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Anonymous message' }],
        { username: undefined },
      );

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when System sender messages are long pressed', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Connected to channel' }],
        { username: 'System' },
        { sender: 'System' },
      );

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when system (lowercase) sender messages are long pressed', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Connection established' }],
        { username: 'system' },
        { sender: 'system' },
      );

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnReply).not.toHaveBeenCalled();
    });
  });

  describe('Zero-width emotes', () => {
    test('should mark zero-width emotes to overlay the previous emote only when consecutive', () => {
      const message = createMockMessage([
        {
          type: 'emote',
          content: 'Base',
          original_name: 'Base',
          name: 'Base',
          id: 'base-1',
          url: 'https://example.com/base.avif',
          site: '7TV Global',
          zero_width: false,
          width: 128,
          height: 128,
        },
        {
          type: 'emote',
          content: 'Overlay',
          original_name: 'Overlay',
          name: 'Overlay',
          id: 'overlay-1',
          url: 'https://example.com/overlay.avif',
          site: '7TV Global',
          zero_width: true,
          width: 128,
          height: 128,
        },
        {
          type: 'text',
          content: ' ',
        },
        {
          type: 'emote',
          content: 'Detached',
          original_name: 'Detached',
          name: 'Detached',
          id: 'overlay-2',
          url: 'https://example.com/detached.avif',
          site: '7TV Global',
          zero_width: true,
          width: 128,
          height: 128,
        },
      ]);

      const { getByText } = render(<RichChatMessage {...message} />);

      expect(getByText('Base')).toBeOnTheScreen();

      expect(getByText('Overlay:overlay')).toBeOnTheScreen();

      expect(getByText('Detached')).toBeOnTheScreen();
    });
  });

  describe('Reply Context Navigation', () => {
    test('should call onReplyContextPress with the parent message id', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'This is a reply' }],
        {
          'reply-parent-msg-id': 'parent-msg-456',
        },
        {
          parentDisplayName: 'OriginalUser',
          replyBody: 'The original message',
          replyDisplayName: 'OriginalUser',
        },
      );

      const { getByTestId } = render(
        <RichChatMessage
          {...message}
          onReplyContextPress={mockOnReplyContextPress}
        />,
      );

      fireEvent.press(getByTestId('chat-reply-context-button'));

      expect(mockOnReplyContextPress).toHaveBeenCalledTimes(1);

      expect(mockOnReplyContextPress).toHaveBeenCalledWith('parent-msg-456');
    });

    test('should render reply-target @mentions as plain text but keep other mention colors', () => {
      const message = createMockMessage(
        [
          { type: 'mention', content: '@OriginalUser' },
          { type: 'text', content: ' ping ' },
          { type: 'mention', content: '@OtherUser' },
        ],
        undefined,
        {
          parentDisplayName: 'OriginalUser',
          replyBody: 'The original message',
          replyDisplayName: 'OriginalUser',
        },
      );

      const { getAllByText } = render(
        <RichChatMessage {...message} showInlineReplyContext />,
      );

      const replyTargetMentions = getAllByText('@OriginalUser');

      expect(replyTargetMentions[0]).toHaveStyle({
        fontSize: 14,
        lineHeight: 17,
      });

      expect(replyTargetMentions[0]).not.toHaveStyle({
        fontWeight: '700',
      });

      const otherMention = getAllByText('@OtherUser')[0];

      expect(otherMention).toBeOnTheScreen();
      expect(otherMention).toHaveStyle({
        color: generateRandomTwitchColor('OtherUser'),
      });
      expect(otherMention).not.toHaveStyle({
        color: 'rgba(255, 255, 255, 0.5)',
      });
    });
  });

  describe('Message Interactions', () => {
    test('should call onMessageLongPress when message is long pressed', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByTestId } = render(
        <RichChatMessage
          {...message}
          onReply={mockOnReply}
          onMessageLongPress={mockOnMessageLongPress}
        />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(mockOnMessageLongPress).toHaveBeenCalledTimes(1);

      const longPressData = mockOnMessageLongPress.mock.calls[0]?.[0];

      expect({
        login: longPressData?.login,
        message_id: longPressData?.messageData.message_id,
        userId: longPressData?.userId,
        username: longPressData?.username,
      }).toEqual({
        login: 'testuser',
        message_id: 'msg-123',
        userId: '123456',
        username: 'testuser',
      });
    });

    test('should render emotes in messages', () => {
      const emoteData: ParsedPart<'emote'> = {
        type: 'emote',
        content: 'Kappa',
        original_name: 'Kappa',
        name: 'Kappa',
        id: '25',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
        site: 'Twitch Channel',
      };

      const message = createMockMessage([emoteData]);

      const { getByTestId } = render(
        <RichChatMessage
          {...message}
          onReply={mockOnReply}
          onEmotePress={mockOnEmotePress}
        />,
      );

      expect(getByTestId('emote-renderer')).toBeOnTheScreen();
    });
  });

  describe('First Message Indicator', () => {
    test('should render first message indicator when first-msg is set', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'My first message!' }],
        { 'first-msg': '1' },
      );

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(getByText('First message')).toBeOnTheScreen();
    });

    test('should NOT render first message indicator for regular messages', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Regular message' },
      ]);

      const { queryByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByText('First message')).toBeNull();
    });
  });

  describe('Username Display', () => {
    test('should display username with color when provided', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello!' }], {
        username: 'ColoredUser',
        color: '#FF5500',
      });

      const { getAllByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(getAllByText('ColoredUser:').length).toBeGreaterThan(0);
    });

    test('should NOT display username when not provided', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Anonymous message' }],
        { username: undefined },
      );

      const { queryByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByText('testuser:')).toBeNull();
      expect(queryByText('undefined:')).toBeNull();
    });
  });

  describe('Reply Data', () => {
    test('should pass correct data to onReply callback when long pressed', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Test message' }],
        { username: 'TestUser', color: '#1AC9A2' },
        {
          message_id: 'unique-msg-id',
          channel: 'test-channel',
          sender: 'TestUser',
        },
      );

      const { getByTestId } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      const replyMessage = mockOnReply.mock.calls[0]?.[0];
      expect({
        channel: replyMessage?.channel,
        color: replyMessage?.userstate.color,
        id: typeof replyMessage?.id,
        message: replyMessage?.message,
        message_id: replyMessage?.message_id,
        sender: replyMessage?.sender,
        username: replyMessage?.userstate.username,
      }).toEqual({
        channel: 'test-channel',
        color: '#1AC9A2',
        id: 'string',
        message: [{ type: 'text', content: 'Test message' }],
        message_id: 'unique-msg-id',
        sender: 'TestUser',
        username: 'TestUser',
      });
    });
  });

  test('calls onUsernamePress when the username is tapped', () => {
    const onUsernamePress = jest.fn();
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const { getByTestId } = render(
      <RichChatMessage {...message} onUsernamePress={onUsernamePress} />,
    );

    fireEvent.press(getByTestId('chat-username-button'));

    const pressData = onUsernamePress.mock.calls[0]?.[0];
    expect({
      login: pressData?.login,
      userId: pressData?.userId,
      username: pressData?.username,
    }).toEqual({
      login: 'testuser',
      userId: '123456',
      username: 'testuser',
    });
  });

  test('can hide timestamps when disabled', () => {
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const { queryByText } = render(
      <RichChatMessage {...message} showTimestamp={false} />,
    );

    expect(queryByText('12:00')).toBeNull();
  });

  test('highlights rows that mention the current user', () => {
    const message = createMockMessage([
      { type: 'mention', content: '@testuser' },
      { type: 'text', content: ' hello' },
    ]);

    const { getByTestId } = render(
      <RichChatMessage {...message} currentUsername='testuser' />,
    );

    expect(getByTestId('chat-message')).toHaveStyle({
      borderLeftColor: theme.colorViolet,
      borderLeftWidth: 2,
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

  test('renders denser text in compact mode', () => {
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const { getByText } = render(
      <RichChatMessage {...message} density='compact' />,
    );

    expect(getByText('hello world')).toHaveStyle({
      fontSize: 11,
      lineHeight: 14,
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
    expect(queryByTestId('chat-message')).not.toHaveTextContent(
      /TestUser\s+TestUser/,
    );
    expect(queryByTestId('chat-username-button')).toBeNull();
  });

  test('renders a standalone channel point redemption as a system notice', () => {
    const message = createMockMessage(
      [{ type: 'text', content: 'RewardUser redeemed Hydrate' }],
      {
        username: 'twitch',
        login: 'twitch',
      },
      {
        isTwitchSystemNotice: true,
        isChannelPointRedemption: false,
      },
    );

    const { getByText, queryByTestId, queryByText } = render(
      <RichChatMessage {...message} />,
    );

    expect(getByText('RewardUser redeemed Hydrate')).toBeOnTheScreen();
    expect(queryByText('Channel Points reward')).toBeNull();
    expect(queryByTestId('chat-username-button')).toBeNull();
  });

  test('renders channel point reward chrome when the user shares a message', () => {
    const message = createMockMessage(
      [{ type: 'text', content: '你好' }],
      {
        'display-name': 'testUser',
        username: 'testUser',
        login: 'testuser',
        'room-id': '67890',
        'custom-reward-id': 'reward-tts',
        'msg-param-custom-reward-title': 'Chinese TTS',
      },
      {
        isChannelPointRedemption: true,
      },
    );

    const { getByText, queryByText } = render(<RichChatMessage {...message} />);

    expect(getByText('redeemed')).toBeOnTheScreen();
    expect(getByText('Chinese TTS')).toBeOnTheScreen();
    expect(getByText('testUser')).toBeOnTheScreen();
    expect(getByText('testUser:')).toBeOnTheScreen();
    expect(getByText('你好')).toBeOnTheScreen();
    expect(queryByText('Channel Points reward')).toBeNull();
  });

  test('renders Highlight My Message with compact meta and violet accent', () => {
    const message = createMockMessage(
      [{ type: 'text', content: 'hello world' }],
      {
        'display-name': 'Rexdain',
        username: 'Rexdain',
        login: 'rexdain',
        'msg-id': 'highlighted-message',
        'custom-reward-id': 'reward-highlight',
      },
      {
        isChannelPointRedemption: true,
        isHighlightedMessage: true,
      },
    );

    const { getByTestId, getByText, queryByText } = render(
      <RichChatMessage {...message} />,
    );

    expect(getByText('Highlight My Message')).toBeOnTheScreen();
    expect(getByText('Rexdain:')).toBeOnTheScreen();
    expect(queryByText('redeemed')).toBeNull();
    expect(getByTestId('chat-message')).toHaveStyle({
      borderLeftWidth: 2,
    });
  });
});
