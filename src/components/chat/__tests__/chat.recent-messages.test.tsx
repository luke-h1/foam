import { View } from 'react-native';
import type { ReactNode } from 'react';
import type { KeyboardStickyViewProps } from 'react-native-keyboard-controller';
import * as keyboardControllerModule from 'react-native-keyboard-controller';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import { createChatMessage } from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat.fixture';
import { createScrollAnchor } from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat-scroll.fixture';
import * as FlashListModule from '@app/components/flash-list/FlashList';
import {
  createLoggedInAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import { AuthContextTestProvider } from '@app/context/AuthContext';
import { recentMessagesService } from '@app/services/recent-messages-service';
import { sevenTvService } from '@app/services/seven-tv-service';
import * as twitchChatServiceModule from '@app/services/twitch-chat-service';
import {
  getChatUnreadCount,
  resetChatUnread,
} from '@app/store/chat/actions/chat-unread';
import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { clearMessages } from '@app/store/chat/actions/messages';
import { clearPersonalEmotesCache } from '@app/store/chat/actions/personal-emotes';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  initialPreferences,
  replacePreferences,
} from '@app/store/preference-store';
import * as clearImageCacheModule from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';

import { Chat } from '../Chat';
import * as actionSheetModule from '../components/action-sheet/ActionSheet';
import * as badgePreviewSheetModule from '../components/badge-preview-sheet/BadgePreviewSheet';
import * as chatRowModule from '../components/chat-message/ChatRow';
import * as chatInputSectionModule from '../components/ChatInputSection';
import * as chatListModule from '../components/ChatList';
import * as chatViewControlsModule from '../components/ChatViewControls';
import * as emotePreviewSheetModule from '../components/emote-preview-sheet/EmotePreviewSheet';
import * as emoteSheetModule from '../components/emote-sheet/EmoteSheet';
import * as resumeScrollModule from '../components/ResumeScroll';
import * as settingsSheetModule from '../components/settings-sheet/SettingsSheet';
import * as userActionSheetModule from '../components/UserActionSheet';
import * as useChatEmoteLoaderModule from '../hooks/use-chat-emote-loader';
import * as useChatScrollModule from '../hooks/use-chat-scroll';
import * as useSevenTvWsModule from '../hooks/use-seven-tv-ws';

/**
 * `useSafeAreaInsets` is a non-configurable re-export getter on the package
 * root, so `jest.spyOn` must target the commonjs submodule Jest resolves.
 */
const safeAreaContextModule = jest.requireActual<
  typeof import('react-native-safe-area-context')
>('react-native-safe-area-context/lib/commonjs/SafeAreaContext');

const mockScrollToBottom = jest.fn();

jest.spyOn(FlashListModule, 'FlashList').mockImplementation(() => <View />);

/**
 * Structurally valid `WebSocket` without a real connection; the suite's
 * sockets are stubbed so nothing calls the prototype's methods.
 */
const createWebSocketStub = (): WebSocket => Object.create(WebSocket.prototype);

jest.spyOn(useSevenTvWsModule, 'useSevenTvWs').mockReturnValue({
  subscribeToChannel: jest.fn(),
  unsubscribeFromChannel: jest.fn(),
  isConnected: () => false,
  readyState: 0,
  getConnectionState: () => 'DISCONNECTED',
  ws: createWebSocketStub(),
});

const mockedGetRecentMessages = jest
  .spyOn(recentMessagesService, 'getRecentMessages')
  .mockResolvedValue([]);

/**
 * The real resolver falls back to `''` (never `undefined`) when a Twitch
 * user has no linked 7TV account.
 */
jest.spyOn(sevenTvService, 'get7tvUserId').mockResolvedValue('');
jest.spyOn(sevenTvService, 'getPersonalEmoteSet').mockResolvedValue([]);
jest.spyOn(sevenTvService, 'getUserCosmeticsGql').mockResolvedValue(null);

jest.spyOn(twitchChatServiceModule, 'getChatUserState').mockReturnValue({
  mod: '0',
  'badges-raw': '',
  badges: '',
  color: '#ffffff',
});

jest.spyOn(twitchChatServiceModule, 'useChatUserState').mockReturnValue({
  mod: '0',
  'badges-raw': '',
  badges: '',
  color: '#ffffff',
});

jest.spyOn(twitchChatServiceModule, 'useTwitchChat').mockReturnValue({
  connectionState: 1,
  getWebSocket: createWebSocketStub,
  isConnected: () => true,
  partChannel: jest.fn(),
  joinChannel: jest.fn(),
  sendMessage: jest.fn(),
  sendChatCommand: jest.fn(),
  sendAction: jest.fn(),
});

jest
  .spyOn(clearImageCacheModule, 'clearImageCache')
  .mockImplementation(async () => {});

jest.spyOn(logger.chat, 'debug').mockImplementation(() => {});
jest.spyOn(logger.chat, 'error').mockImplementation(() => {});
jest.spyOn(logger.chat, 'info').mockImplementation(() => {});
jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'debug').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'info').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'warn').mockImplementation(() => {});

jest.spyOn(Clipboard, 'setStringAsync').mockResolvedValue(true);

/**
 * The real `KeyboardStickyView` export is a read-only forwardRef object, so
 * swap via `Object.defineProperty`, not spyOn or assignment.
 */
Object.defineProperty(keyboardControllerModule, 'KeyboardStickyView', {
  configurable: true,
  value: ({ children, ...props }: KeyboardStickyViewProps) => (
    <View {...props}>{children}</View>
  ),
});

// spyOn can't patch the root's non-configurable getter; spy the defining submodule - the barrel forwards live.
jest
  .spyOn(safeAreaContextModule, 'useSafeAreaInsets')
  .mockReturnValue({ top: 0, right: 0, bottom: 0, left: 0 });

const noRender = () => null;

/**
 * Each is memo()/forwardRef wrapped (an object, not a function), so spyOn
 * cannot wrap it; `Object.defineProperty` swaps the read-only binding.
 */
Object.defineProperty(actionSheetModule, 'ActionSheet', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(badgePreviewSheetModule, 'BadgePreviewSheet', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(chatInputSectionModule, 'ChatInputSection', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(chatListModule, 'ChatList', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(chatRowModule, 'ChatRow', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(chatViewControlsModule, 'ChatViewControls', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(emotePreviewSheetModule, 'EmotePreviewSheet', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(resumeScrollModule, 'ResumeScroll', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(settingsSheetModule, 'SettingsSheet', {
  configurable: true,
  value: noRender,
});

Object.defineProperty(userActionSheetModule, 'UserActionSheet', {
  configurable: true,
  value: noRender,
});

jest.spyOn(emoteSheetModule, 'EmoteSheet').mockImplementation(() => <View />);

const emptyChatEmoteLoaderResult = {
  status: 'idle',
  sevenTvEmoteSetId: undefined,
  refetch: jest.fn().mockResolvedValue(undefined),
  cancel: jest.fn(),
} satisfies ReturnType<typeof useChatEmoteLoaderModule.useChatEmoteLoader>;

jest
  .spyOn(useChatEmoteLoaderModule, 'useChatEmoteLoader')
  .mockReturnValue(emptyChatEmoteLoaderResult);

const listIsAtBottomRef = { current: true };

const settledChatScrollResult = {
  isAtBottom: true,
  isScrollingToBottom: false,
  shouldMaintainScrollAtEnd: true,
  scrollAnchor: createScrollAnchor({
    isAtBottomRef: listIsAtBottomRef,
    noteScrollAwayIntent: jest.fn(),
    maintainBottomAfterContentChange: jest.fn(),
  }),
  scrollHandlers: {
    onContentSizeChange: jest.fn(),
    onEndReached: jest.fn(),
    onMomentumScrollBegin: jest.fn(),
    onMomentumScrollEnd: jest.fn(),
    onScroll: jest.fn(),
    onScrollBeginDrag: jest.fn(),
    onScrollEndDrag: jest.fn(),
  },
  scrollToBottom: mockScrollToBottom,
  cleanup: jest.fn(),
} satisfies ReturnType<typeof useChatScrollModule.useChatScroll>;

jest
  .spyOn(useChatScrollModule, 'useChatScroll')
  .mockReturnValue(settledChatScrollResult);

interface StoredRow {
  id: string;
  isHistorical: boolean | undefined;
  moderationNotice: string | undefined;
  sender: string;
}

function storedRows(): StoredRow[] {
  return chatStore$.messages.peek().map(message => {
    const [firstPart] = message.message;

    const systemText =
      message.sender === 'System' && firstPart && 'content' in firstPart
        ? firstPart.content
        : undefined;

    return {
      id: systemText ?? message.message_id,
      isHistorical: message.isHistorical,
      moderationNotice: message.moderationNotice,
      sender: message.sender,
    };
  });
}

function cachedRows(messageCount: number): StoredRow[] {
  return Array.from({ length: messageCount }, (_, index) => ({
    id: `cached-${index}`,
    isHistorical: true,
    moderationNotice: undefined,
    sender: 'cached',
  }));
}

function requestedHistory(): [string, number | undefined][] {
  return mockedGetRecentMessages.mock.calls.map(([channel, , limit]) => [
    channel,
    limit,
  ]);
}

function seedPersistedHistory(messageCount: number) {
  chatStore$.recentMessagesByChannel.set({
    'channel-1': Array.from({ length: messageCount }, (_, index) =>
      createChatMessage({
        overrides: { sender: 'cached' },
        tags: { id: `cached-${index}` },
        text: `cached ${index}`,
      }),
    ),
  });
}

function SignedInWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const authContext = createLoggedInAuthContextValue({
    user: createTestUser({
      id: 'current-user-id',
      login: 'currentuser',
      display_name: 'CurrentUser',
    }),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextTestProvider {...authContext}>
        {children}
      </AuthContextTestProvider>
    </QueryClientProvider>
  );
}

function renderChat() {
  return render(<Chat channelId='channel-1' channelName='foam' />, {
    wrapper: SignedInWrapper,
  });
}

function setShowRecentMessages(showRecentMessages: boolean) {
  replacePreferences({
    ...initialPreferences,
    chatScrollback: 150,
    deletedMessageStyle: 'notice',
    show7TvEmotes: true,
    showRecentMessages,
  });
}

describe('Chat recent messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMessages();
    clearUserCosmeticsCache();
    clearPersonalEmotesCache();
    resetChatUnread();
    listIsAtBottomRef.current = true;
    chatStore$.recentMessagesByChannel.set({});
    setShowRecentMessages(true);
  });

  test('replays recent IRC messages into the store without unread increments', async () => {
    mockedGetRecentMessages.mockResolvedValueOnce([
      'PING',
      '@id=missing-channel PRIVMSG',
      '@display-name=RecentUser;id=msg-1;user-id=user-1 :recent!recent@recent.tmi.twitch.tv PRIVMSG #foam :hello chat',
      '@display-name=SubUser;id=notice-1;msg-id=resub :sub!sub@sub.tmi.twitch.tv USERNOTICE #foam :subbed',
      '@display-name=BadUser;id=msg-3;user-id=user-3 :baduser!baduser@baduser.tmi.twitch.tv PRIVMSG #foam :spam',
      '@ban-duration=600 :tmi.twitch.tv CLEARCHAT #foam baduser',
      '@target-msg-id=msg-1 :tmi.twitch.tv CLEARMSG #foam',
      '@target-msg-id=msg-2 :tmi.twitch.tv CLEARMESSAGE #foam',
      '@msg-id=host_on :tmi.twitch.tv NOTICE #foam :hosting enabled',
      '@emote-only=0;followers-only=-1;r9k=0;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #foam',
    ]);

    listIsAtBottomRef.current = false;
    renderChat();

    await waitFor(() => {
      expect(mockScrollToBottom).toHaveBeenCalledTimes(1);
    });

    expect(requestedHistory()).toEqual([['foam', 150]]);

    expect(storedRows()).toEqual<StoredRow[]>([
      {
        id: 'baduser has been timed out for 10m',
        isHistorical: undefined,
        moderationNotice: undefined,
        sender: 'System',
      },
      {
        id: 'hosting enabled',
        isHistorical: undefined,
        moderationNotice: undefined,
        sender: 'System',
      },
      {
        id: 'notice-1',
        isHistorical: true,
        moderationNotice: undefined,
        sender: 'SubUser',
      },
      {
        id: 'msg-3',
        isHistorical: true,
        moderationNotice: 'Timed out (600s)',
        sender: 'BadUser',
      },
    ]);

    expect(getChatUnreadCount()).toBe(0);
  });

  test('settles to bottom after restoring persisted recent messages', () => {
    setShowRecentMessages(false);
    seedPersistedHistory(12);

    renderChat();

    expect(mockScrollToBottom).toHaveBeenCalledTimes(1);

    expect(storedRows()).toEqual<StoredRow[]>(cachedRows(12));

    expect(requestedHistory()).toEqual([]);
  });

  test('defers cached-history bottom settle until remote history replay finishes', async () => {
    seedPersistedHistory(12);
    mockedGetRecentMessages.mockResolvedValueOnce([]);

    renderChat();

    expect(mockScrollToBottom).not.toHaveBeenCalled();

    expect(storedRows()).toEqual<StoredRow[]>(cachedRows(12));

    await waitFor(() => {
      expect(mockScrollToBottom).toHaveBeenCalledTimes(1);
    });

    expect(requestedHistory()).toEqual([['foam', 150]]);

    expect(storedRows()).toEqual<StoredRow[]>(cachedRows(12));
  });

  test('does not load recent messages when the preference is disabled', () => {
    setShowRecentMessages(false);

    renderChat();

    expect(requestedHistory()).toEqual([]);

    expect(storedRows()).toEqual<StoredRow[]>([]);
  });
});
