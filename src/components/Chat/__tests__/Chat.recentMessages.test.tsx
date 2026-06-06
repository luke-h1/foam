import {
  useChatRenderPreferences,
  usePreferences,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { render, waitFor } from '@testing-library/react-native';
import { Chat } from '../Chat';
import { recentMessagesService } from '@app/services/recent-messages-service';
import {
  addMessage,
  clearMessages,
  moderateMessagesByLogin,
  removeMessageById,
  restoreRecentMessagesForChannel,
} from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { useChatMessages } from '../hooks/useChatMessages';

const mockScrollToBottom = jest.fn();

jest.mock('@app/components/FlashList/FlashList', () => ({
  FlashList: () => null,
}));

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: () => ({
    user: {
      id: 'current-user-id',
      login: 'currentuser',
      display_name: 'CurrentUser',
    },
  }),
}));

jest.mock('@app/hooks/useSeventvWs', () => ({
  useSeventvWs: () => ({
    subscribeToChannel: jest.fn(),
    unsubscribeFromChannel: jest.fn(),
    isConnected: () => false,
    readyState: 0,
  }),
}));

jest.mock('@app/hooks/ws/constants', () => ({
  ReadyState: {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  },
}));

jest.mock('@app/services/recent-messages-service', () => {
  const actual = jest.requireActual('@app/services/recent-messages-service');
  return {
    ...actual,
    recentMessagesService: {
      getRecentMessages: jest.fn(),
    },
  };
});

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    get7tvUserId: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@app/services/twitch-badge-service', () => ({
  twitchBadgeService: {},
}));

jest.mock('@app/services/twitch-chat-service', () => ({
  useTwitchChat: () => ({
    connectionState: 1,
    isConnected: () => true,
    partChannel: jest.fn(),
    joinChannel: jest.fn(),
    sendMessage: jest.fn(),
    sendChatCommand: jest.fn(),
    getUserState: () => ({
      mod: '0',
      'badges-raw': '',
      badges: '',
      color: '#ffffff',
    }),
  }),
}));

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {},
}));

jest.mock('@app/store/chatStore/channelLoad', () => ({
  clearCache: jest.fn(),
  fetchUserPersonalEmotes: jest.fn(),
  getCurrentEmoteData: jest.fn(() => null),
  getSevenTvEmoteSetId: jest.fn(() => null),
  getUserPersonalEmotes: jest.fn(() => []),
  updateSevenTvEmotes: jest.fn(),
}));

jest.mock('@app/store/chatStore/cosmetics', () => ({
  fetchAndCacheUserCosmetics: jest.fn(),
  getUserBadge: jest.fn(),
}));

jest.mock('@app/store/chatStore/hooks', () => ({
  useChannelEmoteData: jest.fn(() => null),
  useMessages: jest.fn(() => []),
}));

jest.mock('@app/store/chatStore/state', () => ({
  chatStore$: {
    currentChannelId: {
      set: jest.fn(),
    },
    emojis: {
      peek: jest.fn(() => []),
    },
    messages: {
      get: jest.fn(() => []),
      peek: jest.fn(() => []),
    },
    userBadgeIds: {},
    userPaintIds: {},
  },
}));

jest.mock('@app/store/chatStore/messages', () => ({
  addMessage: jest.fn(),
  clearMessages: jest.fn(),
  getMessageById: jest.fn(() => undefined),
  getMessageColor: jest.fn(() => undefined),
  getUserMessageColor: jest.fn(() => undefined),
  moderateMessageById: jest.fn(),
  moderateMessagesByLogin: jest.fn(),
  removeMessageById: jest.fn(),
  restoreRecentMessagesForChannel: jest.fn(),
  updateMessage: jest.fn(),
}));

jest.mock('@app/store/preferenceStore', () => ({
  useChatRenderPreferences: jest.fn(),
  usePreferences: jest.fn(),
  useUpdatePreferences: jest.fn(),
}));

jest.mock('@app/utils/chat/emoteProcessor', () => ({
  processEmotesWorklet: jest.fn(() => []),
}));

jest.mock('@app/utils/image/clearImageCache', () => ({
  clearImageCache: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    stvWs: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
  }),
}));

jest.mock('react-native-keyboard-controller', () => {
  const { View } = require('react-native');
  return {
    KeyboardStickyView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
    }) => <View {...props}>{children}</View>,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('sonner-native', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('../components/ActionSheet/ActionSheet', () => ({
  ActionSheet: () => null,
}));

jest.mock('../components/BadgePreviewSheet/BadgePreviewSheet', () => ({
  BadgePreviewSheet: () => null,
}));

jest.mock('../components/ChatInputSection', () => ({
  ChatInputSection: () => null,
}));

jest.mock('../components/ChatList', () => ({
  ChatList: () => null,
}));

jest.mock('../components/ChatMessage/RichChatMessage', () => ({
  RichChatMessage: () => null,
}));

jest.mock('../components/ChatViewControls', () => ({
  ChatViewControls: () => null,
}));

jest.mock('../components/EmotePreviewSheet/EmotePreviewSheet', () => ({
  EmotePreviewSheet: () => null,
}));

jest.mock('../components/EmoteSheet/EmoteSheet', () => ({
  EmoteSheet: () => null,
}));

jest.mock('../components/ResumeScroll', () => ({
  ResumeScroll: () => null,
}));

jest.mock('../components/SettingsSheet/SettingsSheet', () => ({
  SettingsSheet: () => null,
}));

jest.mock('../components/UserActionSheet', () => ({
  UserActionSheet: () => null,
}));

jest.mock('../hooks/useChatEmoteLoader', () => ({
  useChatEmoteLoader: () => ({
    status: 'idle',
    sevenTvEmoteSetId: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn(),
  }),
}));

jest.mock('../hooks/useChatLifecycle', () => ({
  useChatLifecycle: () => ({
    currentEmoteSetIdRef: { current: null },
  }),
}));

jest.mock('../hooks/useChatMessages', () => ({
  useChatMessages: jest.fn(),
}));

jest.mock('../hooks/useChatScroll', () => ({
  useChatScroll: () => ({
    isAtBottom: true,
    isAtBottomRef: { current: true },
    isScrollingToBottom: false,
    isScrollingToBottomRef: { current: false },
    unreadCount: 0,
    setUnreadCount: jest.fn(),
    handleScroll: jest.fn(),
    handleScrollBeginDrag: jest.fn(),
    handleScrollEndDrag: jest.fn(),
    handleMomentumScrollEnd: jest.fn(),
    handleEndReached: jest.fn(),
    handleContentSizeChange: jest.fn(),
    scrollToBottom: mockScrollToBottom,
    maintainBottomAfterContentChange: jest.fn(),
    cleanup: jest.fn(),
  }),
}));

jest.mock('../hooks/useChatSevenTvCallbacks', () => ({
  useChatSevenTvCallbacks: () => ({}),
}));

jest.mock('../hooks/useEmoteReprocessing', () => ({
  useEmoteReprocessing: jest.fn(),
}));

const mockedUsePreferences = jest.mocked(usePreferences);
const mockedUseChatRenderPreferences = jest.mocked(useChatRenderPreferences);
const mockedUseUpdatePreferences = jest.mocked(useUpdatePreferences);
const mockedGetRecentMessages = jest.mocked(
  recentMessagesService.getRecentMessages,
);
const mockedUseChatMessages = jest.mocked(useChatMessages);
const mockedRestoreRecentMessagesForChannel = jest.mocked(
  restoreRecentMessagesForChannel,
);
const mockMessagesGet = jest.mocked(chatStore$.messages.get);
const mockMessagesPeek = jest.mocked(chatStore$.messages.peek);

const handleNewMessage = jest.fn();
const forceFlush = jest.fn();
const clearLocalMessages = jest.fn();
const moderateBufferedMessageById = jest.fn();
const moderateBufferedMessagesByLogin = jest.fn();
const removeBufferedMessageById = jest.fn();

const setPreferences = (showRecentMessages = true) => {
  const preferences = {
    updatedAt: 0,
    theme: 'foam-dark',
    hapticFeedback: true,
    streamListLayout: 'compact',
    chatDensity: 'compact',
    showAlternatingChatRows: false,
    chatTimestamps: true,
    disableEmoteAnimations: false,
    disableChat: false,
    disableStream: false,
    useUIKitForWebView: false,
    emojiStyle: 'twitter',
    highlightOwnMentions: true,
    show7TvEmotes: true,
    show7tvBadges: true,
    showBttvEmotes: true,
    showBttvBadges: true,
    showChatterinoEmotes: true,
    showFFzEmotes: true,
    showFFzBadges: true,
    showInlineReplyContext: true,
    showRecentMessages,
    showTwitchEmotes: true,
    showTwitchBadges: true,
    showUnreadJumpPill: true,
    update: jest.fn(),
  } satisfies ReturnType<typeof usePreferences>;

  mockedUsePreferences.mockReturnValue(preferences);
  mockedUseChatRenderPreferences.mockReturnValue(preferences);
  mockedUseUpdatePreferences.mockReturnValue(preferences.update);
};

describe('Chat recent messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRestoreRecentMessagesForChannel.mockReturnValue(0);
    mockMessagesGet.mockReturnValue([]);
    mockMessagesPeek.mockReturnValue([]);
    setPreferences();
    const chatMessages = {
      handleNewMessage,
      clearLocalMessages,
      moderateBufferedMessageById,
      moderateBufferedMessagesByLogin,
      removeBufferedMessageById,
      cleanup: jest.fn(),
      forceFlush,
      getBufferSize: jest.fn(() => 0),
    } satisfies ReturnType<typeof useChatMessages>;

    mockedUseChatMessages.mockReturnValue(chatMessages);
  });

  test('loads recent IRC messages through the chat pipeline without unread increments', async () => {
    mockedGetRecentMessages.mockResolvedValueOnce([
      'PING',
      '@id=missing-channel PRIVMSG',
      '@display-name=RecentUser;id=msg-1;user-id=user-1 :recent!recent@recent.tmi.twitch.tv PRIVMSG #foam :hello chat',
      '@display-name=SubUser;id=notice-1;msg-id=resub :sub!sub@sub.tmi.twitch.tv USERNOTICE #foam :subbed',
      '@ban-duration=600 :tmi.twitch.tv CLEARCHAT #foam baduser',
      '@target-msg-id=msg-1 :tmi.twitch.tv CLEARMSG #foam',
      '@target-msg-id=msg-2 :tmi.twitch.tv CLEARMESSAGE #foam',
      '@msg-id=host_on :tmi.twitch.tv NOTICE #foam :hosting enabled',
      '@emote-only=0;followers-only=-1;r9k=0;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #foam',
    ]);

    render(<Chat channelId='channel-1' channelName='foam' />);

    await waitFor(() => {
      expect(forceFlush).toHaveBeenCalled();
    });

    expect(mockedGetRecentMessages).toHaveBeenCalledWith(
      'foam',
      expect.any(AbortSignal),
    );
    expect(
      handleNewMessage.mock.calls.map(([message, options]) => ({
        channel: message.channel,
        id: 'id' in message ? message.id : undefined,
        message_id: message.message_id,
        options,
        sender: message.sender,
      })),
    ).toEqual([
      {
        channel: 'foam',
        id: 'msg-1_msg-1',
        message_id: 'msg-1',
        options: { countUnread: false },
        sender: 'RecentUser',
      },
      {
        channel: '',
        id: 'notice-1',
        message_id: 'resub',
        options: { countUnread: false },
        sender: '',
      },
    ]);
    expect(moderateBufferedMessagesByLogin).toHaveBeenCalledWith(
      'baduser',
      'Timed out (600s)',
    );
    expect(moderateMessagesByLogin).toHaveBeenCalledWith(
      'baduser',
      'Timed out (600s)',
    );
    expect(moderateBufferedMessageById).toHaveBeenCalledWith(
      'msg-1',
      'Deleted',
    );
    expect(moderateBufferedMessageById).toHaveBeenCalledWith(
      'msg-2',
      'Deleted',
    );
    expect(removeMessageById).toHaveBeenCalledWith('msg-1');
    expect(removeMessageById).toHaveBeenCalledWith('msg-2');
    expect(addMessage).toHaveBeenCalled();
    expect(clearMessages).not.toHaveBeenCalled();
    expect(mockScrollToBottom).toHaveBeenCalledTimes(1);
  });

  test('settles to bottom after restoring persisted recent messages', () => {
    setPreferences(false);
    mockedRestoreRecentMessagesForChannel.mockReturnValueOnce(12);

    render(<Chat channelId='channel-1' channelName='foam' />);

    expect(mockScrollToBottom).toHaveBeenCalledTimes(1);
  });

  test('defers cached-history bottom settle until remote history replay finishes', async () => {
    mockedRestoreRecentMessagesForChannel.mockReturnValueOnce(12);
    mockedGetRecentMessages.mockResolvedValueOnce([]);

    render(<Chat channelId='channel-1' channelName='foam' />);

    expect(mockScrollToBottom).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(forceFlush).toHaveBeenCalled();
    });

    expect(mockScrollToBottom).toHaveBeenCalledTimes(1);
  });

  test('does not load recent messages when the preference is disabled', () => {
    setPreferences(false);

    render(<Chat channelId='channel-1' channelName='foam' />);

    expect(mockedGetRecentMessages).not.toHaveBeenCalled();
  });
});
