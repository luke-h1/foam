/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable camelcase */
import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { render, fireEvent } from '@testing-library/react-native';
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

    expect(getByText('Hello world')).toBeTruthy();
    expect(queryByText('Hello')).toBeNull();
    expect(queryByText('world')).toBeNull();
  });

  describe('Long Press Reply', () => {
    test('should call onReply when message is long pressed (regular messages)', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent(getByText('Hello world!'), 'longPress');

      expect(mockOnReply).toHaveBeenCalledTimes(1);
      expect(mockOnReply).toHaveBeenCalledWith(
        expect.objectContaining({
          message_id: 'msg-123',
          sender: 'testuser',
          userstate: expect.objectContaining({
            username: 'testuser',
            color: '#FF0000',
          }),
        }),
      );
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

      fireEvent(getByTestId('chat-message'), 'longPress');

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

      fireEvent(getByTestId('chat-message'), 'longPress');

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

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent(getByText('Thanks for subscribing!'), 'longPress');

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

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent(getByText('Keep up the great content!'), 'longPress');

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when messages without username are long pressed', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Anonymous message' }],
        { username: undefined },
      );

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent(getByText('Anonymous message'), 'longPress');

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when System sender messages are long pressed', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Connected to channel' }],
        { username: 'System' },
        { sender: 'System' },
      );

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent(getByText('Connected to channel'), 'longPress');

      expect(mockOnReply).not.toHaveBeenCalled();
    });

    test('should NOT call onReply when system (lowercase) sender messages are long pressed', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Connection established' }],
        { username: 'system' },
        { sender: 'system' },
      );

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent(getByText('Connection established'), 'longPress');

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

      expect(getByText('Base')).toBeTruthy();
      expect(getByText('Overlay:overlay')).toBeTruthy();
      expect(getByText('Detached')).toBeTruthy();
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
  });

  describe('Message Interactions', () => {
    test('should call onMessageLongPress when message is long pressed', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByText } = render(
        <RichChatMessage
          {...message}
          onReply={mockOnReply}
          onMessageLongPress={mockOnMessageLongPress}
        />,
      );

      const textElement = getByText('Hello world!');
      fireEvent(textElement, 'longPress');

      expect(mockOnMessageLongPress).toHaveBeenCalledTimes(1);
      expect(mockOnMessageLongPress).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'testuser',
          login: 'testuser',
          userId: '123456',
          messageData: expect.objectContaining({
            message_id: 'msg-123',
          }),
        }),
      );
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

      expect(getByTestId('emote-renderer')).toBeTruthy();
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

      expect(getByText('first-msg')).toBeTruthy();
    });

    test('should NOT render first message indicator for regular messages', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Regular message' },
      ]);

      const { queryByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByText('first-msg')).toBeNull();
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
        { username: 'TestUser', color: '#00FF00' },
        {
          message_id: 'unique-msg-id',
          channel: 'test-channel',
          sender: 'TestUser',
        },
      );

      const { getByText } = render(
        <RichChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent(getByText('Test message'), 'longPress');

      expect(mockOnReply).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          message_id: 'unique-msg-id',
          channel: 'test-channel',
          sender: 'TestUser',
          message: [{ type: 'text', content: 'Test message' }],
          userstate: expect.objectContaining({
            username: 'TestUser',
            color: '#00FF00',
          }),
        }),
      );
    });
  });
});
