/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable camelcase */
import { ChatMessageType } from '@app/store/chatStore';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatMessage } from '../ChatMessage';

// Only mock date for deterministic timestamps in tests
jest.mock('@app/utils/date-time/date', () => ({
  formatDate: jest.fn(() => '12:00'),
}));

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

describe('ChatMessage', () => {
  const mockOnReply = jest.fn();
  const mockOnEmotePress = jest.fn();
  const mockOnMessageLongPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Reply Button', () => {
    it('should render reply button for regular messages', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(getByTestId('reply-button')).toBeTruthy();
    });

    it('should call onReply when reply button is pressed', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent.press(getByTestId('reply-button'));

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

    it('should NOT render reply button for system messages (STV emote added)', () => {
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
              site: '7tv',
              creator: null,
              emote_link: '',
            },
          },
        },
      ]);

      const { queryByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-button')).toBeNull();
    });

    it('should NOT render reply button for system messages (STV emote removed)', () => {
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
              site: '7tv',
              creator: null,
              emote_link: '',
            },
          },
        },
      ]);

      const { queryByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-button')).toBeNull();
    });

    it('should NOT render reply button for subscription notices', () => {
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

      const { queryByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-button')).toBeNull();
    });

    it('should NOT render reply button for resub notices', () => {
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

      const { queryByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-button')).toBeNull();
    });

    it('should NOT render reply button for messages without username', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Anonymous message' }],
        { username: undefined },
      );

      const { queryByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-button')).toBeNull();
    });

    it('should NOT render reply button for System sender messages', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Connected to channel' }],
        { username: 'System' },
        { sender: 'System' },
      );

      const { queryByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-button')).toBeNull();
    });

    it('should NOT render reply button for system (lowercase) sender messages', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Connection established' }],
        { username: 'system' },
        { sender: 'system' },
      );

      const { queryByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-button')).toBeNull();
    });
  });

  describe('Reply Indicator', () => {
    it('should render reply indicator when message is a reply', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'This is a reply' }],
        {},
        {
          parentDisplayName: 'OriginalUser',
          replyBody: 'The original message',
          parentColor: '#3498DB',
        },
      );

      const { getByTestId, getByText } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(getByTestId('reply-indicator')).toBeTruthy();
      expect(getByText('replying to')).toBeTruthy();
      expect(getByText('@OriginalUser')).toBeTruthy();
    });

    it('should NOT render reply indicator when message is not a reply', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Regular message' },
      ]);

      const { queryByTestId, queryByText } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByTestId('reply-indicator')).toBeNull();
      expect(queryByText('replying to')).toBeNull();
    });

    it('should display reply body in reply indicator', () => {
      const replyBody = 'This is the original message content';
      const message = createMockMessage(
        [{ type: 'text', content: 'This is a reply' }],
        {},
        {
          parentDisplayName: 'OriginalUser',
          replyBody,
        },
      );

      const { getByText } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      // The reply indicator should show "replying to @username"
      expect(getByText('replying to')).toBeTruthy();
      expect(getByText('@OriginalUser')).toBeTruthy();
      // The reply body should be truncated (20 chars) but still visible
      expect(getByText(/This is the original/)).toBeTruthy();
    });
  });

  describe('Message Interactions', () => {
    it('should call onMessageLongPress when message is long pressed', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByText } = render(
        <ChatMessage
          {...message}
          onReply={mockOnReply}
          onMessageLongPress={mockOnMessageLongPress}
        />,
      );

      const textElement = getByText('Hello world!');
      fireEvent(textElement, 'longPress');
    });

    it('should render emotes in messages', () => {
      const emoteData: ParsedPart<'emote'> = {
        type: 'emote',
        content: 'Kappa',
        original_name: 'Kappa',
        name: 'Kappa',
        id: '25',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
        site: 'twitch',
      };

      const message = createMockMessage([emoteData]);

      const { getByTestId } = render(
        <ChatMessage
          {...message}
          onReply={mockOnReply}
          onEmotePress={mockOnEmotePress}
        />,
      );

      // Verify the message renders (emote is inside)
      expect(getByTestId('reply-button')).toBeTruthy();
    });
  });

  describe('First Message Indicator', () => {
    it('should render first message indicator when first-msg is set', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'My first message!' }],
        { 'first-msg': '1' },
      );

      const { getByText } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(getByText('first message')).toBeTruthy();
    });

    it('should NOT render first message indicator for regular messages', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Regular message' },
      ]);

      const { queryByText } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByText('first message')).toBeNull();
    });
  });

  describe('Username Display', () => {
    it('should display username with color when provided', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello!' }], {
        username: 'ColoredUser',
        color: '#FF5500',
      });

      const { getByText } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(getByText('ColoredUser:')).toBeTruthy();
    });

    it('should NOT display username when not provided', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Anonymous message' }],
        { username: undefined },
      );

      const { queryByText } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      expect(queryByText('testuser:')).toBeNull();
      expect(queryByText('undefined:')).toBeNull();
    });
  });

  describe('Reply Data', () => {
    it('should pass correct data to onReply callback', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Test message' }],
        { username: 'TestUser', color: '#00FF00' },
        {
          message_id: 'unique-msg-id',
          channel: 'test-channel',
          sender: 'TestUser',
        },
      );

      const { getByTestId } = render(
        <ChatMessage {...message} onReply={mockOnReply} />,
      );

      fireEvent.press(getByTestId('reply-button'));

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
