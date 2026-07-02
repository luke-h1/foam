import type { ObservableReadable } from '@legendapp/state';
import { renderHook } from '@testing-library/react-native';
import { act, render } from '@testing-library/react-native';

import type { ChatListRef } from '@app/components/Chat/components/ChatList';
import { RichChatMessage } from '@app/components/Chat/components/ChatMessage/RichChatMessage';
import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import { useIsHighlightedReplyTargetMessage } from '@app/store/chat/react/transientSelectors';
import { useChatRowPreferences } from '@app/store/preferences/selectors';
import { createRef } from '@app/test/createRef';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';

import { useChatRowRenderer } from '../useChatRowRenderer';
import {
  createChatMessage,
  createEmoteData,
  createSevenTvEmote,
} from './__fixtures__/useChat.fixture';

function mockIsObservableReadable(
  value: unknown,
): value is ObservableReadable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'peek' in value &&
    typeof value.peek === 'function'
  );
}

jest.mock('@legendapp/state/react', () => ({
  useSelector: jest.fn((selector: unknown) => {
    if (typeof selector === 'function') {
      return selector();
    }
    if (mockIsObservableReadable(selector)) {
      return selector.peek();
    }
    return selector;
  }),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    emojis: {
      peek: jest.fn(() => []),
    },
    mentionLoginRevision: {
      peek: jest.fn(() => 7),
    },
    paints: {},
    userPaintIds: {},
  },
}));

jest.mock('@app/store/chat/actions/messages', () => ({
  getUserMessageColor: jest.fn(() => '#cached-sender'),
}));

jest.mock('@app/store/chat/actions/chatColorCaches', () => ({
  getSessionCacheString: jest.fn(),
  setSessionCacheString: jest.fn(),
}));

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
}));

jest.mock('@app/store/preferences/selectors', () => ({
  useChatRowPreferences: jest.fn(),
}));

jest.mock('@app/utils/chat/emoteProcessor', () => ({
  processEmotesWorklet: jest.fn((params: { inputString: string }) => [
    { type: 'text', content: `parsed:${params.inputString}` },
  ]),
}));

jest.mock('@app/utils/chat/resolveCachedSenderColor', () => ({
  resolveCachedSenderColor: jest.fn(() => '#resolved-sender'),
}));

jest.mock('@app/utils/chat/resolveMentionColor', () => ({
  resolveMentionColor: jest.fn(() => '#mention-color'),
}));

jest.mock('@app/store/chat/react/transientSelectors', () => ({
  useIsHighlightedReplyTargetMessage: jest.fn(() => true),
}));

jest.mock('../../components/ChatMessage/RichChatMessage', () => ({
  RichChatMessage: jest.fn(() => null),
}));

const mockGetCurrentEmoteData = jest.mocked(getCurrentEmoteData);
const mockGetSessionCacheString = jest.mocked(getSessionCacheString);
const mockProcessEmotesWorklet = jest.mocked(processEmotesWorklet);
const mockResolveMentionColor = jest.mocked(resolveMentionColor);
const mockRichChatMessage = jest.mocked(RichChatMessage);
const mockSetSessionCacheString = jest.mocked(setSessionCacheString);
const mockUseChatRowPreferences = jest.mocked(useChatRowPreferences);
const mockUseIsHighlightedReplyTargetMessage = jest.mocked(
  useIsHighlightedReplyTargetMessage,
);

function renderRowRenderer() {
  const highlightedReplyTargetTimeoutRef = { current: null };
  const scrollToIndex = jest.fn();
  const listRef = createRef<ChatListRef | null>({
    scrollToIndex,
  } as unknown as ChatListRef);
  const messages = [
    createChatMessage({
      tags: {
        id: 'msg-1',
      },
    }),
    createChatMessage({
      overrides: {
        parentDisplayName: 'ParentUser',
        replyBody: 'parent body',
      },
      tags: {
        id: 'msg-2',
        login: 'viewer',
        'display-name': 'Viewer',
        'user-id': 'viewer-1',
      },
      text: 'hello OMEGALUL',
    }),
  ];
  const setHighlightedReplyTargetMessageId = jest.fn();
  const onBadgePress = jest.fn();
  const onEmotePress = jest.fn();
  const onMessageLongPress = jest.fn();
  const onUsernamePress = jest.fn();

  const hook = renderHook(() =>
    useChatRowRenderer({
      channelId: 'channel-1',
      highlightedReplyTargetTimeoutRef,
      highlightedUsers: ['VIPUser', 'viewer'],
      listRef,
      messages$: {
        peek: jest.fn(() => messages),
      },
      onBadgePress,
      onEmotePress,
      onMessageLongPress,
      onUsernamePress,
      preferences: {
        chatDensity: 'compact',
        chatTimestamps: true,
        disableEmoteAnimations: true,
        highlightOwnMentions: true,
        showAlternatingChatRows: true,
        showInlineReplyContext: true,
      },
      setHighlightedReplyTargetMessageId,
      user: {
        display_name: 'Viewer',
        login: 'viewer',
      },
    }),
  );

  return {
    highlightedReplyTargetTimeoutRef,
    hook,
    listRef,
    scrollToIndex,
    messages,
    onEmotePress,
    onMessageLongPress,
    onUsernamePress,
    setHighlightedReplyTargetMessageId,
  };
}

describe('useChatRowRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUseChatRowPreferences.mockReturnValue({
      chatDensity: 'compact',
      chatTimestamps: true,
      disableEmoteAnimations: true,
      highlightOwnMentions: true,
      showAlternatingChatRows: true,
      showInlineReplyContext: true,
    });
    mockGetCurrentEmoteData.mockReturnValue(
      createEmoteData({
        sevenTvChannelEmotes: [createSevenTvEmote()],
      }),
    );
    mockGetSessionCacheString.mockReturnValue(undefined);
  });

  test('builds list metadata from row preferences and highlighted users', () => {
    const { hook, messages } = renderRowRenderer();
    const replyMessage = messages[1];
    if (!replyMessage) {
      throw new Error('Expected reply message fixture');
    }

    expect(hook.result.current.keyExtractor(replyMessage)).toBe('msg-2_msg-2');
    expect(hook.result.current.getItemType(replyMessage)).toBe(
      'user_chat-reply',
    );
    expect(hook.result.current.messageListExtraData).toEqual({
      chatDensity: 'compact',
      chatFontScale: undefined,
      currentUsernameNormalized: 'viewer',
      customHighlightsKey: '',
      disableEmoteAnimations: true,
      highlightedUsersKey: 'VIPUser\u001fviewer',
      // mentionLoginRevision intentionally excluded from extraData (would
      // re-render every row per mention resolve); MentionSpan subscribes to it.
      showAlternatingChatRows: true,
      showInlineReplyContext: true,
      showTimestamps: true,
    });
  });

  test('renders a real chat row with display flags, callbacks, mentions, and emote parsing', () => {
    const { hook, messages, onEmotePress, onUsernamePress } =
      renderRowRenderer();
    const replyMessage = messages[1];
    if (!replyMessage) {
      throw new Error('Expected reply message fixture');
    }

    const rendered = hook.result.current.renderItem({
      item: replyMessage,
      index: 1,
      target: 'Cell',
    });
    if (!rendered) {
      throw new Error('Expected renderItem to return an element');
    }

    render(rendered);

    const props = mockRichChatMessage.mock.calls[0]?.[0];
    if (
      !props?.parseTextForEmotes ||
      !props.getMentionColor ||
      !props.onEmotePress ||
      !props.onUsernamePress
    ) {
      throw new Error('Expected RichChatMessage callback props');
    }
    expect({
      currentUsername: props?.currentUsername,
      currentUsernameNormalized: props?.currentUsernameNormalized,
      density: props?.density,
      highlightedUserSet: [...(props?.highlightedUserSet ?? [])],
      messageDisplay: props?.messageDisplay,
      onEmotePress: props?.onEmotePress,
      onUsernamePress: props?.onUsernamePress,
    }).toEqual({
      currentUsername: 'viewer',
      currentUsernameNormalized: 'viewer',
      density: 'compact',
      highlightedUserSet: ['vipuser', 'viewer'],
      messageDisplay: {
        disableEmoteAnimations: true,
        isAlternatingRow: true,
        isAnnouncement: undefined,
        isChannelPointRedemption: false,
        isHighlightedMessage: undefined,
        isHighlightedMessageTarget: true,
        isSharedChatDuplicated: undefined,
        isTwitchSystemNotice: undefined,
        showInlineReplyContext: true,
        showTimestamp: true,
      },
      onEmotePress,
      onUsernamePress,
    });

    expect(props.parseTextForEmotes('OMEGALUL')).toEqual([
      { type: 'text', content: 'parsed:OMEGALUL' },
    ]);
    expect(mockProcessEmotesWorklet.mock.calls[0]?.[0].inputString).toBe(
      'OMEGALUL',
    );
    expect(props.getMentionColor('@DisplayName')).toBe('#mention-color');
    expect(mockResolveMentionColor).toHaveBeenCalledWith('@DisplayName');
    expect(mockSetSessionCacheString.mock.calls[0]).toEqual([
      'mentionColors',
      'displayname',
      '#mention-color',
    ]);
    expect(mockUseIsHighlightedReplyTargetMessage).toHaveBeenCalledWith(
      'channel-1',
      'msg-2',
    );
  });

  test('reply context press scrolls to the parent message and clears the highlight after the timeout', () => {
    jest.useFakeTimers();
    try {
      const {
        hook,
        messages,
        scrollToIndex,
        setHighlightedReplyTargetMessageId,
      } = renderRowRenderer();
      const replyMessage = messages[1];
      if (!replyMessage) {
        throw new Error('Expected reply message fixture');
      }

      const rendered = hook.result.current.renderItem({
        item: replyMessage,
        index: 1,
        target: 'Cell',
      });
      if (!rendered) {
        throw new Error('Expected renderItem to return an element');
      }

      render(rendered);
      const props = mockRichChatMessage.mock.calls[0]?.[0];
      const onReplyContextPress = props?.onReplyContextPress;
      if (!onReplyContextPress) {
        throw new Error('Expected onReplyContextPress callback');
      }

      act(() => {
        onReplyContextPress('msg-1');
      });

      expect(scrollToIndex.mock.calls[0]?.[0]).toEqual({
        animated: true,
        index: 0,
        viewPosition: 0.35,
      });
      expect(setHighlightedReplyTargetMessageId.mock.calls[0]).toEqual([
        'msg-1',
      ]);

      act(() => {
        jest.advanceTimersByTime(2200);
      });

      const clearHighlight =
        setHighlightedReplyTargetMessageId.mock.calls[1]?.[0];
      expect(typeof clearHighlight).toBe('function');
      if (typeof clearHighlight === 'function') {
        expect(clearHighlight('msg-1')).toBe(null);
        expect(clearHighlight('different-message')).toBe('different-message');
      }
    } finally {
      jest.useRealTimers();
    }
  });

  test('returns null for non-renderable rows and plain text when emote data is missing', () => {
    mockGetCurrentEmoteData.mockReturnValue(createEmoteData());
    const { hook } = renderRowRenderer();
    const invalidMessage = createChatMessage({
      overrides: {
        message_id: '',
      },
    });

    expect(
      hook.result.current.renderItem({
        item: invalidMessage,
        index: 0,
        target: 'Cell',
      }),
    ).toBe(null);
  });
});
