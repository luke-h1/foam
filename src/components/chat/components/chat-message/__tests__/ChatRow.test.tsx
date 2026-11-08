import { StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import type { ReactTestInstance } from 'react-test-renderer';

import {
  act,
  fireEvent,
  render,
  userEvent,
} from '@testing-library/react-native';

import { MESSAGE_LONG_PRESS_DELAY_MS } from '@app/components/chat/components/chat-message/hooks/use-chat-row-long-press';
import { isRowTouchHeld } from '@app/components/chat/util/chatRowTouchHold';
import { resetChatOverlays } from '@app/store/chat/actions/chat-overlays';
import { chatOverlays$ } from '@app/store/chat/observables/chat-overlays';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { preferences$ } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { ChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { MessageToken } from '@app/types/chat/messageToken';

import { ChatRow } from '../ChatRow';
import * as EmoteTokenModule from '../renderers/EmoteToken';

type EmoteTokenProps = ComponentProps<typeof EmoteTokenModule.EmoteToken>;

/**
 * EmoteToken is memo() wrapped, so jest.spyOn cannot wrap it - swap the
 * export directly. The suite asserts orchestration, not its output.
 */
Object.defineProperty(EmoteTokenModule, 'EmoteToken', {
  configurable: true,
  value: ({
    token,
    disableAnimations,
    onEmoteTouchStart,
    shouldOverlayPrevious,
  }: EmoteTokenProps) => (
    <View
      onTouchStart={() => onEmoteTouchStart?.(token)}
      testID={disableAnimations ? 'emote-token-static' : 'emote-token'}
    >
      <Text>
        {token?.name ?? 'emote'}
        {shouldOverlayPrevious ? ':overlay' : ''}
      </Text>
    </View>
  ),
});

const createMockMessage = (
  message: MessageToken[],
  userstate: Partial<UserStateTags> = {},
  overrides: Partial<ChatMessageType<'userstate'>> = {},
): ChatMessageType<'userstate'> => {
  const message_id = 'msg-123';
  const message_nonce = 'nonce-123';

  return {
    id: `${message_id}_${message_nonce}`,
    userstate: createUserStateTags({
      username: 'testuser',
      'display-name': 'TestUser',
      login: 'testuser',
      color: '#FF0000',
      'user-id': '123456',
      ...userstate,
    }),
    message,
    badges: [],
    channel: 'testchannel',
    message_id,
    message_nonce,
    sender: 'testuser',
    replyParentLogin: '',
    replyBody: '',
    ...overrides,
  };
};

const touchAt = (pageX: number, pageY: number) => ({
  nativeEvent: { pageX, pageY },
});

function findTextAncestor(
  element: ReactTestInstance,
): ReactTestInstance | null {
  let ancestor: ReactTestInstance | null = element.parent;

  while (ancestor) {
    if (String(ancestor.type) === 'Text') {
      return ancestor;
    }

    ancestor = ancestor.parent;
  }

  return null;
}

function hasTextAncestor(element: ReactTestInstance): boolean {
  return findTextAncestor(element) !== null;
}

function fireMessageLongPress(
  element: ReactTestInstance,
  options: { driftDp?: number } = {},
) {
  const { driftDp = 0 } = options;
  jest.useFakeTimers();
  fireEvent(element, 'touchStart', touchAt(100, 100));

  if (driftDp > 0) {
    fireEvent(element, 'touchMove', touchAt(100 + driftDp, 100));
  }

  act(() => {
    jest.advanceTimersByTime(MESSAGE_LONG_PRESS_DELAY_MS);
  });

  fireEvent(element, 'touchEnd', touchAt(100 + driftDp, 100));
  jest.useRealTimers();
}

describe('ChatRow', () => {
  const mockOnMessageLongPress = jest.fn();
  const mockOnReplyContextPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    chatStore$.userPaintIds.set({});
  });

  test('coalesces adjacent text tokens into one rendered text node', () => {
    const message = createMockMessage([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' ' },
      { type: 'text', content: 'world' },
    ]);

    const { getByText, queryByText } = render(<ChatRow {...message} />);

    expect(getByText('Hello world')).toBeOnTheScreen();

    expect(queryByText('Hello')).toBeNull();

    expect(queryByText('world')).toBeNull();
  });

  test('tints /me action message bodies in the sender colour', () => {
    const message = createMockMessage(
      [{ type: 'text', content: 'waves at chat' }],
      { color: '#FF0000' },
      { isAction: true },
    );

    const { getByText } = render(<ChatRow {...message} />);

    expect(getByText('waves at chat')).toHaveStyle({
      color: 'rgb(255, 0, 0)',
    });
  });

  test('does not tint a regular message body in the sender colour', () => {
    const message = createMockMessage(
      [{ type: 'text', content: 'waves at chat' }],
      { color: '#FF0000' },
    );

    const { getByText } = render(<ChatRow {...message} />);

    expect(getByText('waves at chat')).not.toHaveStyle({
      color: 'rgb(255, 0, 0)',
    });
  });

  test('does not render object placeholders for malformed text tokens', () => {
    const malformedMessage: MessageToken[] = [
      {
        type: 'text',
        // @ts-expect-error malformed IRC payload should not render as visible text
        content: { text: 'bad payload' },
      },
    ];

    const message = createMockMessage(malformedMessage);

    const { queryByText } = render(<ChatRow {...message} />);

    expect(queryByText('[object Object]')).toBeNull();
  });

  test('does not render a blank slot for a badge without a url', () => {
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
            type: 'Twitch Global Badge',
            provider: 'twitch',
            url: '',
          },
        ],
      },
    );

    const { queryByTestId } = render(<ChatRow {...message} />);

    expect(queryByTestId('chat-badge')).toBeNull();
  });

  describe('Long Press', () => {
    test('survives the touch jitter android reports while a finger rests', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByTestId } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      fireMessageLongPress(getByTestId('chat-message'), { driftDp: 4 });

      expect(mockOnMessageLongPress).toHaveBeenCalledTimes(1);
    });

    test('holds live flushes while a finger rests on the row, through jitter', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello' }]);

      const { getByTestId } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      const row = getByTestId('chat-message');

      fireEvent(row, 'touchStart', touchAt(100, 100));
      fireEvent(row, 'touchMove', touchAt(104, 100));
      const heldThroughJitter = isRowTouchHeld();

      fireEvent(row, 'touchEnd', touchAt(104, 100));

      expect([heldThroughJitter, isRowTouchHeld()]).toEqual([true, false]);
    });

    test('releases the flush hold once the finger drifts into a scroll', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello' }]);

      const { getByTestId } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      const row = getByTestId('chat-message');

      fireEvent(row, 'touchStart', touchAt(100, 100));
      fireEvent(row, 'touchMove', touchAt(140, 100));

      expect(isRowTouchHeld()).toBe(false);
    });

    test('releases the flush hold when the touch is cancelled', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello' }]);

      const { getByTestId } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      const row = getByTestId('chat-message');

      fireEvent(row, 'touchStart', touchAt(100, 100));
      const heldBeforeCancel = isRowTouchHeld();

      fireEvent(row, 'touchCancel', touchAt(100, 100));

      expect([heldBeforeCancel, isRowTouchHeld()]).toEqual([true, false]);
    });

    test('releases the flush hold when the long press fires, before the touch ends', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello' }]);

      const { getByTestId } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      const row = getByTestId('chat-message');

      jest.useFakeTimers();
      fireEvent(row, 'touchStart', touchAt(100, 100));
      act(() => jest.advanceTimersByTime(MESSAGE_LONG_PRESS_DELAY_MS));
      const heldAfterLongPress = isRowTouchHeld();

      fireEvent(row, 'touchEnd', touchAt(100, 100));
      jest.useRealTimers();

      expect([
        mockOnMessageLongPress.mock.calls.length,
        heldAfterLongPress,
      ]).toEqual([1, false]);
    });

    test('does not hold flushes for a row that has no long press', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello' }]);
      const { getByTestId } = render(<ChatRow {...message} />);

      fireEvent(getByTestId('chat-message'), 'touchStart', touchAt(100, 100));

      expect(isRowTouchHeld()).toBe(false);
    });

    test('releases the flush hold when the held row unmounts', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello' }]);

      const { getByTestId, unmount } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      fireEvent(getByTestId('chat-message'), 'touchStart', touchAt(100, 100));
      const heldBeforeUnmount = isRowTouchHeld();

      unmount();

      expect([heldBeforeUnmount, isRowTouchHeld()]).toEqual([true, false]);
    });

    test('cancels once the finger drifts past the tolerance', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByTestId } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      fireMessageLongPress(getByTestId('chat-message'), { driftDp: 40 });

      expect(mockOnMessageLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Zero-width emotes', () => {
    test('marks zero-width emotes to overlay the previous emote only when consecutive', () => {
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

      const { getByText } = render(<ChatRow {...message} />);

      expect(getByText('Base')).toBeOnTheScreen();

      expect(getByText('Overlay:overlay')).toBeOnTheScreen();

      expect(getByText('Detached')).toBeOnTheScreen();
    });
  });

  describe('Reply Context Navigation', () => {
    test('calls onReplyContextPress with the parent message id', async () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'This is a reply' }],
        {
          'reply-parent-msg-id': 'parent-msg-456',
        },
        {
          parentDisplayName: 'OriginalUser',
          replyBody: 'The original message',
          replyParentLogin: 'OriginalUser',
        },
      );

      const { getByTestId } = render(
        <ChatRow {...message} onReplyContextPress={mockOnReplyContextPress} />,
      );

      // The reply header is a responder, not an onPress element.
      await userEvent.press(getByTestId('chat-reply-context-button'));

      expect(mockOnReplyContextPress).toHaveBeenCalledTimes(1);

      expect(mockOnReplyContextPress).toHaveBeenCalledWith('parent-msg-456');
    });

    test('renders reply-target @mentions as plain text but keep other mention colors', () => {
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
          replyParentLogin: 'OriginalUser',
        },
      );

      const { getAllByText } = render(
        <ChatRow
          {...message}
          messageDisplay={{ showInlineReplyContext: true }}
        />,
      );

      const replyTargetMentions = getAllByText('@OriginalUser');

      expect(replyTargetMentions[0]).toHaveStyle({
        fontSize: 14,
        lineHeight: 21,
      });

      expect(replyTargetMentions[0]).not.toHaveStyle({
        fontWeight: '700',
      });

      const otherMention = getAllByText('@OtherUser')[0];

      expect(otherMention).toBeOnTheScreen();

      expect(otherMention).toHaveStyle({
        color: 'rgb(210, 105, 30)',
      });

      expect(otherMention).not.toHaveStyle({
        color: 'rgba(255, 255, 255, 0.5)',
      });
    });
  });

  describe('Message Interactions', () => {
    test('calls onMessageLongPress when message is long pressed', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Hello world!' },
      ]);

      const { getByTestId } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
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

    test('a long press on an emote opens the channel emote action sheet', () => {
      resetChatOverlays('chan-1');

      const emoteData: MessageToken<'emote'> = {
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
        <ChatRow
          {...message}
          broadcasterId='chan-1'
          onMessageLongPress={mockOnMessageLongPress}
        />,
      );

      jest.useFakeTimers();
      fireEvent(getByTestId('emote-token'), 'touchStart', touchAt(100, 100));
      fireEvent(getByTestId('chat-message'), 'touchStart', touchAt(100, 100));
      act(() => jest.advanceTimersByTime(MESSAGE_LONG_PRESS_DELAY_MS));
      fireEvent(getByTestId('chat-message'), 'touchEnd', touchAt(100, 100));
      jest.useRealTimers();

      expect({
        channelId: chatOverlays$.channelId.peek(),
        longPressCalls: mockOnMessageLongPress.mock.calls.length,
        selectedEmoteAction: chatOverlays$.selectedEmoteAction.peek(),
      }).toEqual({
        channelId: 'chan-1',
        longPressCalls: 0,
        selectedEmoteAction: emoteData,
      });

      resetChatOverlays('');
    });

    test('renders emotes in messages', () => {
      const emoteData: MessageToken<'emote'> = {
        type: 'emote',
        content: 'Kappa',
        original_name: 'Kappa',
        name: 'Kappa',
        id: '25',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
        site: 'Twitch Channel',
      };

      const message = createMockMessage([emoteData]);

      const { getByTestId } = render(<ChatRow {...message} />);

      expect(getByTestId('emote-token')).toBeOnTheScreen();
    });

    test('flows an ordinary emote inline, inside the row Text', () => {
      // The flex-wrap path leaves the tail blank; an ordinary emote belongs in
      // the row's Text, where `bodyEmoteLine` raises the leading so it is not clipped.
      const emoteData: MessageToken<'emote'> = {
        type: 'emote',
        content: 'Kappa',
        original_name: 'Kappa',
        name: 'Kappa',
        id: '25',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
        site: 'Twitch Channel',
      };

      const message = createMockMessage([
        { type: 'text', content: 'look ' },
        emoteData,
      ]);

      const { getByTestId } = render(<ChatRow {...message} />);

      expect(hasTextAncestor(getByTestId('emote-token'))).toBe(true);
    });

    test('keeps a zero-width emote out of the row Text', () => {
      // A zero-width emote composites its overlay with absolute positioning,
      // which does not survive inside a Text, so it still takes the flex path.
      const emoteData: MessageToken<'emote'> = {
        type: 'emote',
        content: 'SoSnowy',
        original_name: 'SoSnowy',
        name: 'SoSnowy',
        id: '26',
        url: 'https://cdn.7tv.app/emote/26/1x.webp',
        site: '7TV Channel',
        zero_width: true,
      };

      const message = createMockMessage([
        { type: 'text', content: 'look ' },
        emoteData,
      ]);

      const { getByTestId } = render(<ChatRow {...message} />);

      expect(hasTextAncestor(getByTestId('emote-token'))).toBe(false);
    });

    test('keeps the emote leading on a painted row that flows its body inline', () => {
      // A painted row's body still flows inline and carries the emotes on its
      // own, so it needs the emote leading or they clip.
      chatStore$.userPaintIds.set({ '123456': 'paint-1' });

      const emoteData: MessageToken<'emote'> = {
        type: 'emote',
        content: 'Kappa',
        original_name: 'Kappa',
        name: 'Kappa',
        id: '25',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
        site: 'Twitch Channel',
      };

      const message = createMockMessage([
        { type: 'text', content: 'look ' },
        emoteData,
      ]);

      const { getByTestId } = render(<ChatRow {...message} />);

      const bodyText = findTextAncestor(getByTestId('emote-token'));

      expect(StyleSheet.flatten(bodyText?.props['style']).lineHeight).toBe(34);
    });
  });

  describe('First Message Indicator', () => {
    test('renders first message indicator when first-msg is set', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'My first message!' }],
        { 'first-msg': '1' },
      );

      const { getByText } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      expect(getByText('First message')).toBeOnTheScreen();
    });

    test('does not render first message indicator for regular messages', () => {
      const message = createMockMessage([
        { type: 'text', content: 'Regular message' },
      ]);

      const { queryByText } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      expect(queryByText('First message')).toBeNull();
    });
  });

  describe('Username Display', () => {
    test('displays username with color when provided', () => {
      const message = createMockMessage([{ type: 'text', content: 'Hello!' }], {
        username: 'ColoredUser',
        color: '#FF5500',
      });

      const { getAllByText } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      expect(getAllByText('ColoredUser:')).toHaveLength(1);
    });

    test('does not display username when not provided', () => {
      const message = createMockMessage(
        [{ type: 'text', content: 'Anonymous message' }],
        { username: undefined },
      );

      const { queryByText } = render(
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      expect(queryByText('testuser:')).toBeNull();

      expect(queryByText('undefined:')).toBeNull();
    });
  });

  describe('Reply Data', () => {
    test('hands back the message fields and no render props', () => {
      const message = createMockMessage([{ type: 'text', content: 'hi' }]);

      const { getByTestId } = render(
        <ChatRow
          {...message}
          customHighlights={[{ id: 'h', phrase: 'hi', color: '#FF0000' }]}
          fontScale='large'
          onMessageLongPress={mockOnMessageLongPress}
        />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      expect(
        Object.keys(
          mockOnMessageLongPress.mock.calls[0]?.[0]?.messageData ?? {},
        ).sort(),
      ).toEqual(Object.keys(message).sort());
    });

    test('passes correct data to onMessageLongPress when long pressed', () => {
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
        <ChatRow {...message} onMessageLongPress={mockOnMessageLongPress} />,
      );

      fireMessageLongPress(getByTestId('chat-message'));

      const replyMessage =
        mockOnMessageLongPress.mock.calls[0]?.[0]?.messageData;

      expect({
        channel: replyMessage?.channel,
        color: replyMessage?.userstate.color,
        id: replyMessage?.id,
        message: replyMessage?.message,
        message_id: replyMessage?.message_id,
        sender: replyMessage?.sender,
        username: replyMessage?.userstate.username,
      }).toEqual({
        channel: 'test-channel',
        color: '#1AC9A2',
        id: 'msg-123_nonce-123',
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
      <ChatRow {...message} onUsernamePress={onUsernamePress} />,
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

  test('shows the timestamp only while timestamps are enabled', () => {
    const message = createMockMessage(
      [{ type: 'text', content: 'hello world' }],
      {},
      { timestamp: '12:00' },
    );

    const shown = render(
      <ChatRow {...message} messageDisplay={{ showTimestamp: true }} />,
    );

    expect(shown.getByText('12:00')).toBeOnTheScreen();

    shown.unmount();

    const hidden = render(
      <ChatRow {...message} messageDisplay={{ showTimestamp: false }} />,
    );

    expect(hidden.queryByText('12:00')).toBeNull();
  });

  test('highlights rows that mention the current user', () => {
    const message = createMockMessage([
      { type: 'mention', content: '@testuser' },
      { type: 'text', content: ' hello' },
    ]);

    const { getByTestId } = render(
      <ChatRow {...message} currentUsername='testuser' />,
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
      <ChatRow {...message} highlightedUserSet={new Set(['testuser'])} />,
    );

    expect(getByTestId('chat-message')).toHaveStyle({
      borderLeftColor: '#9147FF',
      borderLeftWidth: 2,
    });
  });

  test('keeps the body font size across densities and tightens only leading', () => {
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const comfortable = render(<ChatRow {...message} density='comfortable' />);

    expect(comfortable.getByText('hello world')).toHaveStyle({
      fontSize: 14,
      lineHeight: 21,
    });

    comfortable.unmount();

    const compact = render(<ChatRow {...message} density='compact' />);

    expect(compact.getByText('hello world')).toHaveStyle({
      fontSize: 14,
      lineHeight: 18,
    });
  });

  test('scales the body with the font-scale preference in both densities', () => {
    const message = createMockMessage([
      { type: 'text', content: 'hello world' },
    ]);

    const large = render(
      <ChatRow {...message} density='compact' fontScale='large' />,
    );

    expect(large.getByText('hello world')).toHaveStyle({
      fontSize: 16,
      lineHeight: 21,
    });

    large.unmount();

    const small = render(
      <ChatRow {...message} density='comfortable' fontScale='small' />,
    );

    expect(small.getByText('hello world')).toHaveStyle({
      fontSize: 12,
      lineHeight: 18,
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
        // Stored tokens hold already-unescaped system-msg (parseIrcTags decodes).
        systemMsg:
          'TestUser watched 5 consecutive streams and sparked a watch streak!',
        login: 'testuser',
        displayName: 'TestUser',
      },
    ]);

    const { getByText, queryByTestId } = render(<ChatRow {...message} />);

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
      <ChatRow {...message} />,
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

    const { getByText, queryByText } = render(<ChatRow {...message} />);

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
      <ChatRow {...message} />,
    );

    expect(getByText('Highlight My Message')).toBeOnTheScreen();

    expect(getByText('Rexdain:')).toBeOnTheScreen();

    expect(queryByText('redeemed')).toBeNull();

    expect(getByTestId('chat-message')).toHaveStyle({
      borderLeftWidth: 2,
    });
  });
});

describe('ChatRow shared chat gating', () => {
  afterEach(() => {
    preferences$.sharedChatEnabled.set(true);
  });

  test('shows the shared-chat source label when the flag is enabled', () => {
    preferences$.sharedChatEnabled.set(true);

    const message = createMockMessage(
      [{ type: 'text', content: 'from another channel' }],
      {},
      { isSharedChatDuplicated: true },
    );

    const { getByText } = render(<ChatRow {...message} />);

    expect(getByText('Via shared chat')).toBeOnTheScreen();
  });

  test('hides the shared-chat source label when the flag is disabled', () => {
    preferences$.sharedChatEnabled.set(false);

    const message = createMockMessage(
      [{ type: 'text', content: 'from another channel' }],
      {},
      { isSharedChatDuplicated: true },
    );

    const { queryByText } = render(<ChatRow {...message} />);

    expect(queryByText('Via shared chat')).toBeNull();
  });
});
