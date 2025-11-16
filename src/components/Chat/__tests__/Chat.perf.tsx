import {
  AuthContextTestProvider,
  type AuthContextState,
} from '@app/context/AuthContext';
import {
  ChatContextTestProvider,
  type ChatContextState,
  type ChatMessageType,
} from '@app/context/ChatContext';
import {
  seventvSanitiisedGlobalEmoteSetFixture,
  sevenTvSanitisedChannelEmoteSetFixture,
  twitchTvSanitisedEmoteSetChannelFixture,
  twitchTvSanitisedEmoteSetGlobalFixture,
} from '@app/services/__fixtures__';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { type FC, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { measureRenders } from 'reassure';
import { Chat } from '../Chat';

jest.mock('@app/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

jest.mock('@app/hooks/useTwitchWs', () => ({
  useTwitchWs: jest.fn(() => ({}) as WebSocket),
}));

jest.mock('@app/hooks/useSeventvWs', () => ({
  useSeventvWs: jest.fn(() => ({
    ws: {} as WebSocket,
    subscribeToChannel: jest.fn(),
    unsubscribeFromChannel: jest.fn(),
    isConnected: jest.fn(() => false),
    getConnectionState: jest.fn(() => 'DISCONNECTED' as const),
  })),
}));

jest.mock('@app/hooks/useEmoteProcessor', () => ({
  useEmoteProcessor: () => ({
    processMessage: (message: string) => [{ type: 'text', content: message }],
  }),
}));

jest.mock('@app/services/twitch-chat-service', () => ({
  useTwitchChat: jest.fn(() => ({
    isConnected: jest.fn(() => false),
    partChannel: jest.fn(),
    sendMessage: jest.fn(),
    joinChannel: jest.fn(),
    sendAction: jest.fn(),
    getUserState: jest.fn(() => ({})),
    getWebSocket: jest.fn(),
  })),
}));

const createMockMessage = (
  id: number,
  username: string,
  message: string,
): ChatMessageType<never, never> => {
  const userstate: UserStateTags = {
    'display-name': username,
    login: username.toLowerCase(),
    username: username.toLowerCase(),
    'user-id': `user_${id}`,
    id: `msg_${id}`,
    color: `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`,
    badges: {},
    'badges-raw': '',
    'user-type': '',
    mod: '0',
    subscriber: '0',
    turbo: '0',
    'emote-sets': '',
    'reply-parent-display-name': '',
    'reply-parent-msg-body': '',
    'reply-parent-msg-id': '',
    'reply-parent-user-login': '',
  };

  const parsedMessage: ParsedPart[] = [
    {
      type: 'text',
      content: message,
    },
  ];

  return {
    userstate,
    message: parsedMessage,
    badges: [],
    channel: 'test_channel',
    message_id: `msg_${id}`,
    message_nonce: `nonce_${id}`,
    sender: username,
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
  };
};

const createMockMessages = (count: number): ChatMessageType<never, never>[] => {
  const messages: ChatMessageType<never, never>[] = [];
  const usernames = [
    'justinfan',
    'bob',
    'alice',
    'charlie',
    'delta',
    'echo',
    'foxtrot',
    'golf',
    'hotel',
    'india',
  ];
  const sampleMessages = [
    'Hello chat!',
    'PogChamp',
    'This is a test message',
    'Kappa',
    'WutFace',
    'How are you all doing?',
    'LUL',
    'NotLikeThis',
    'BibleThump',
    'CoolStoryBob',
  ];

  for (let i = 0; i < count; i += 1) {
    const username = usernames[i % usernames.length];
    if (username) {
      const messageIndex = i % sampleMessages.length;
      const sampleMessage = sampleMessages[messageIndex];
      if (sampleMessage) {
        const message = `${sampleMessage} #${i + 1}`;
        messages.push(createMockMessage(i + 1, username, message));
      }
    }
  }

  return messages;
};

const mockAuthContext: AuthContextState = {
  authState: {
    isLoggedIn: false,
    isAnonAuth: true,
    token: {
      accessToken: 'test_token',
      expiresIn: 3600,
      tokenType: 'bearer',
    },
  },
  user: undefined,
  loginWithTwitch: jest.fn(),
  logout: jest.fn(),
  populateAuthState: jest.fn(),
  fetchAnonToken: jest.fn(),
  ready: true,
};

const createMockChatContext = (
  messages: ChatMessageType<never, never>[],
): ChatContextState => {
  const inMemoryCache = new Map<
    string,
    { emotes: Map<string, string>; badges: Map<string, string> }
  >();
  inMemoryCache.set('test_channel_id', {
    emotes: new Map(),
    badges: new Map(),
  });

  return {
    stateRestorationStatus: 'IN_MEMORY',
    loadingState: 'COMPLETED',
    currentChannelId: 'test_channel_id',
    messages,
    twitchChannelEmotes: twitchTvSanitisedEmoteSetChannelFixture,
    twitchGlobalEmotes: twitchTvSanitisedEmoteSetGlobalFixture,
    sevenTvChannelEmotes: sevenTvSanitisedChannelEmoteSetFixture,
    sevenTvGlobalEmotes: seventvSanitiisedGlobalEmoteSetFixture,
    ffzChannelEmotes: [],
    ffzGlobalEmotes: [],
    bttvGlobalEmotes: [],
    bttvChannelEmotes: [],
    twitchGlobalBadges: [],
    twitchChannelBadges: [],
    ffzGlobalBadges: [],
    ffzChannelBadges: [],
    chatterinoBadges: [],
    emojis: [],
    bits: [],
    ttvUsers: [],
    imageCache: new Map(),
    inMemoryCache,
    cacheStats: {
      totalFiles: 0,
      totalSizeBytes: 0,
      queueSize: 0,
      isProcessing: false,
    },
    cacheQueue: [],
    addMessage: jest.fn(),
    addMessages: jest.fn(),
    clearMessages: jest.fn(),
    setBits: jest.fn(),
    addTtvUser: jest.fn(),
    clearTtvUsers: jest.fn(),
    loadChannelResources: jest.fn(),
    clearChannelResources: jest.fn(),
    getCachedEmotes: jest.fn(() => []),
    getCachedBadges: jest.fn(() => []),
    getCurrentEmoteData: jest.fn(() => ({
      sevenTvGlobalEmotes: [],
      sevenTvChannelEmotes: [],
      twitchGlobalEmotes: [],
      twitchChannelEmotes: [],
      ffzChannelEmotes: [],
      ffzGlobalEmotes: [],
      bttvChannelEmotes: [],
      bttvGlobalEmotes: [],
      twitchChannelBadges: [],
      twitchGlobalBadges: [],
      ffzChannelBadges: [],
      ffzGlobalBadges: [],
      chatterinoBadges: [],
    })),
    getSevenTvEmoteSetId: jest.fn(() => null),
    updateSevenTvEmotes: jest.fn(),
    cacheImage: jest.fn(),
    batchCacheImages: jest.fn(),
    processCacheQueue: jest.fn(),
    processSingleCacheItem: jest.fn(),
    addToMemoryCache: jest.fn(),
    getCachedImageUrl: jest.fn(() => ''),
    expireCache: jest.fn(),
    clearCache: jest.fn(),
    clearAllCache: jest.fn(),
    refreshChannelResources: jest.fn(),
    getCacheAge: jest.fn(() => 0),
    isCacheExpired: jest.fn(() => false),
  };
};

const TestWrapper: FC<
  PropsWithChildren<{
    authContext?: Partial<AuthContextState>;
    chatContext?: Partial<ChatContextState>;
  }>
> = ({ children, authContext, chatContext }) => {
  const fullAuthContext = { ...mockAuthContext, ...authContext };
  const fullChatContext = {
    ...createMockChatContext([]),
    ...chatContext,
  };

  return (
    <SafeAreaProvider>
      <AuthContextTestProvider {...fullAuthContext}>
        <ChatContextTestProvider {...fullChatContext}>
          {children}
        </ChatContextTestProvider>
      </AuthContextTestProvider>
    </SafeAreaProvider>
  );
};

describe('Chat Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render with empty chat', async () => {
    await measureRenders(
      <TestWrapper chatContext={createMockChatContext([])}>
        <Chat channelId="test_channel_id" channelName="test_channel" />
      </TestWrapper>,
    );
  });

  test('should render with 10 messages', async () => {
    const messages = createMockMessages(10);
    await measureRenders(
      <TestWrapper chatContext={createMockChatContext(messages)}>
        <Chat channelId="test_channel_id" channelName="test_channel" />
      </TestWrapper>,
    );
  });

  test('should render with 50 messages', async () => {
    const messages = createMockMessages(50);
    await measureRenders(
      <TestWrapper chatContext={createMockChatContext(messages)}>
        <Chat channelId="test_channel_id" channelName="test_channel" />
      </TestWrapper>,
    );
  });

  test('should render with 100 messages', async () => {
    const messages = createMockMessages(100);
    await measureRenders(
      <TestWrapper chatContext={createMockChatContext(messages)}>
        <Chat channelId="test_channel_id" channelName="test_channel" />
      </TestWrapper>,
    );
  });

  test('should render with 500 messages', async () => {
    const messages = createMockMessages(500);
    await measureRenders(
      <TestWrapper chatContext={createMockChatContext(messages)}>
        <Chat channelId="test_channel_id" channelName="test_channel" />
      </TestWrapper>,
    );
  });
});
