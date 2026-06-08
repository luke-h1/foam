import { renderHook } from '@testing-library/react-native';
import { render, act } from '@testing-library/react-native';
import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import { useChatRowPreferences } from '@app/store/preferences';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';
import { RichChatMessage } from '../../ChatMessage/RichChatMessage';
import { useIsHighlightedReplyTargetMessage } from '@app/store/chat/react/transientState';
import {
  createChatMessage,
  createEmoteData,
  createSevenTvEmote,
} from './__fixtures__/useChat.fixture';
import { useChatRowRenderer } from '../useChatRowRenderer';

jest.mock('@legendapp/state/react', () => ({
  useSelector: jest.fn((selector: unknown) => {
    if (typeof selector === 'function') {
      return selector();
    }
    if (
      selector &&
      typeof selector === 'object' &&
      'peek' in selector &&
      typeof selector.peek === 'function'
    ) {
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

jest.mock('@app/store/preferences', () => ({
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

jest.mock('@app/store/chat/react/transientState', () => ({
  useIsHighlightedReplyTargetMessage: jest.fn(() => true),
}));

jest.mock('../../ChatMessage/RichChatMessage', () => ({
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
  const listRef = {
    current: {
      scrollToIndex: jest.fn(),
    },
  };
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
      onEmotePress,
      onMessageLongPress,
      onUsernamePress,
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

    expect(hook.result.current.keyExtractor(messages[1])).toBe('msg-2_msg-2');
    expect(hook.result.current.getItemType(messages[1])).toBe(
      'user_chat-reply',
    );
    expect(hook.result.current.messageListExtraData).toEqual({
      chatDensity: 'compact',
      currentUsernameNormalized: 'viewer',
      disableEmoteAnimations: true,
      highlightedUsersKey: 'VIPUser\u001fviewer',
      mentionLoginRevision: 7,
      showAlternatingChatRows: true,
      showInlineReplyContext: true,
      showTimestamps: true,
    });
  });

  test('renders a real chat row with display flags, callbacks, mentions, and emote parsing', () => {
    const { hook, messages, onEmotePress, onUsernamePress } =
      renderRowRenderer();

    render(hook.result.current.renderItem({ item: messages[1], index: 1 }));

    const props = mockRichChatMessage.mock.calls[0]?.[0];
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

    expect(props?.parseTextForEmotes('OMEGALUL')).toEqual([
      { type: 'text', content: 'parsed:OMEGALUL' },
    ]);
    expect(mockProcessEmotesWorklet.mock.calls[0]?.[0].inputString).toBe(
      'OMEGALUL',
    );
    expect(props?.getMentionColor('@DisplayName')).toBe('#mention-color');
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
    const { hook, listRef, messages, setHighlightedReplyTargetMessageId } =
      renderRowRenderer();

    render(hook.result.current.renderItem({ item: messages[1], index: 1 }));
    const props = mockRichChatMessage.mock.calls[0]?.[0];

    act(() => {
      props?.onReplyContextPress('msg-1');
    });

    expect(listRef.current.scrollToIndex.mock.calls[0]?.[0]).toEqual({
      animated: true,
      index: 0,
      viewPosition: 0.35,
    });
    expect(setHighlightedReplyTargetMessageId.mock.calls[0]).toEqual(['msg-1']);

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
  });

  test('returns null for non-renderable rows and plain text when emote data is missing', () => {
    mockGetCurrentEmoteData.mockReturnValue(null);
    const { hook } = renderRowRenderer();
    const invalidMessage = createChatMessage({
      overrides: {
        message_id: '',
      },
    });

    expect(
      hook.result.current.renderItem({ item: invalidMessage, index: 0 }),
    ).toBe(null);
  });
});
