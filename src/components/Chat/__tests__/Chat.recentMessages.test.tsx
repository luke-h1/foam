import { View } from 'react-native';
import type { KeyboardStickyViewProps } from 'react-native-keyboard-controller';
import * as keyboardControllerModule from 'react-native-keyboard-controller';

import { render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import * as FlashListModule from '@app/components/FlashList/FlashList';
import * as authContextModule from '@app/context/AuthContext';
import * as useSyncPaintRendererFlagModule from '@app/hooks/firebase/useSyncPaintRendererFlag';
import { recentMessagesService } from '@app/services/recent-messages-service';
import { sevenTvService } from '@app/services/seventv-service';
import * as twitchChatServiceModule from '@app/services/twitch-chat-service';
import * as channelLoadModule from '@app/store/chat/actions/channelLoad';
import * as cosmeticsModule from '@app/store/chat/actions/cosmetics';
import * as messagesModule from '@app/store/chat/actions/messages';
import {
  addMessage,
  clearMessages,
  getMaxChatMessages,
  restoreRecentMessagesForChannel,
} from '@app/store/chat/actions/messages';
import * as personalEmotesModule from '@app/store/chat/actions/personalEmotes';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { emptyResolvedEmoteData } from '@app/store/chat/types/constants';
import * as preferenceStoreModule from '@app/store/preferenceStore';
import {
  useChatRenderPreferences,
  usePreference,
  usePreferences,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import * as emoteProcessorModule from '@app/utils/chat/emoteProcessor';
import * as devToolsGateModule from '@app/utils/devTools/devToolsGate';
import * as clearImageCacheModule from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';

import { Chat } from '../Chat';
import * as actionSheetModule from '../components/ActionSheet/ActionSheet';
import * as badgePreviewSheetModule from '../components/BadgePreviewSheet/BadgePreviewSheet';
import * as chatInputSectionModule from '../components/ChatInputSection';
import * as chatListModule from '../components/ChatList';
import * as richChatMessageModule from '../components/ChatMessage/RichChatMessage';
import * as chatViewControlsModule from '../components/ChatViewControls';
import * as emotePreviewSheetModule from '../components/EmotePreviewSheet/EmotePreviewSheet';
import * as emoteSheetModule from '../components/EmoteSheet/EmoteSheet';
import * as resumeScrollModule from '../components/ResumeScroll';
import * as settingsSheetModule from '../components/SettingsSheet/SettingsSheet';
import * as userActionSheetModule from '../components/UserActionSheet';
import * as useChatEmoteLoaderModule from '../hooks/useChatEmoteLoader';
import * as useChatLifecycleModule from '../hooks/useChatLifecycle';
import * as useChatMessagesModule from '../hooks/useChatMessages';
import { useChatMessages } from '../hooks/useChatMessages';
import * as useChatScrollModule from '../hooks/useChatScroll';
import * as useEmoteReprocessingModule from '../hooks/useEmoteReprocessing';
import * as useSeventvWsModule from '../hooks/useSeventvWs';
import * as createSevenTvCallbacksModule from '../util/createSevenTvCallbacks';

/**
 * The package only ships types for `lib/typescript/src`, not the
 * `lib/commonjs` submodule Jest actually resolves - `useSafeAreaInsets` is a
 * non-configurable re-export getter on the package root, so `jest.spyOn`
 * can't patch it there and must target this submodule instead. Loading it
 * through `requireActual` (typed via the package root, which re-exports the
 * same shape) reaches the real submodule at runtime without a static import
 * of its untyped build output.
 */
const safeAreaContextModule = jest.requireActual<
  typeof import('react-native-safe-area-context')
>('react-native-safe-area-context/lib/commonjs/SafeAreaContext');

const mockScrollToBottom = jest.fn();

jest.spyOn(FlashListModule, 'FlashList').mockImplementation(() => <View />);

/**
 * Auth is off-limits to edit directly (src/context/AuthContext.tsx), but the
 * test may still change how it stubs the real hook - spy the export instead
 * of replacing the module.
 *
 * SAFETY: Chat only reads `user` off the auth context on the paths this
 * suite exercises; the rest of `AuthContextState` is unused here.
 */
jest.spyOn(authContextModule, 'useAuthContext').mockReturnValue({
  user: {
    id: 'current-user-id',
    login: 'currentuser',
    display_name: 'CurrentUser',
  },
} as ReturnType<typeof authContextModule.useAuthContext>);

// The chat pipeline mounts the dev-only synthetic flood (useChat), now gated on
// dev-tools access. This suite never activates the flood; stub access so it
// stays inert without pulling remote-config / a QueryClient into the render.
jest.spyOn(devToolsGateModule, 'useDevToolsAccess').mockReturnValue('denied');

/**
 * The chat surface resolves the paint-renderer experiment through
 * react-query + remote config; stub it so the suite needs no QueryClient.
 */
jest
  .spyOn(useSyncPaintRendererFlagModule, 'useSyncPaintRendererFlag')
  .mockImplementation(() => {});

/**
 * `Object.create(WebSocket.prototype)` gives a structurally valid `WebSocket`
 * without opening a real connection - this suite's sockets are stubbed out
 * entirely, so nothing ever calls through the prototype's methods.
 */
const createWebSocketStub = (): WebSocket => Object.create(WebSocket.prototype);

jest.spyOn(useSeventvWsModule, 'useSeventvWs').mockReturnValue({
  subscribeToChannel: jest.fn(),
  unsubscribeFromChannel: jest.fn(),
  isConnected: () => false,
  readyState: 0,
  getConnectionState: () => 'DISCONNECTED',
  ws: createWebSocketStub(),
});

// `@app/hooks/ws/constants`'s real `ReadyState` enum already carries these
// same numeric values, so no override is needed there.

jest
  .spyOn(recentMessagesService, 'getRecentMessages')
  .mockImplementation(jest.fn());

/**
 * The real resolver falls back to `''` (never `undefined`) when a Twitch
 * user has no linked 7TV account - match that instead of asserting a value
 * the function's return type (`Promise<string>`) can't actually produce.
 */
jest.spyOn(sevenTvService, 'get7tvUserId').mockResolvedValue('');

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

jest.spyOn(channelLoadModule, 'clearCache').mockImplementation(() => {});
jest
  .spyOn(channelLoadModule, 'getCurrentEmoteData')
  .mockReturnValue(emptyResolvedEmoteData);
// `getSevenTvEmoteSetId`/`updateSevenTvEmotes` aren't exports of this module
// (they live on sevenTvChannelLifecycle) - the old mock stubbed dead keys.
jest
  .spyOn(personalEmotesModule, 'fetchUserPersonalEmotes')
  .mockImplementation(async () => null);
jest.spyOn(personalEmotesModule, 'getUserPersonalEmotes').mockReturnValue([]);

jest
  .spyOn(cosmeticsModule, 'fetchAndCacheUserCosmetics')
  .mockImplementation(async () => null);
jest.spyOn(cosmeticsModule, 'getUserBadge').mockReturnValue(undefined);
jest.spyOn(cosmeticsModule, 'getUserBadgeId').mockReturnValue(undefined);
jest.spyOn(cosmeticsModule, 'getUserPaintId').mockReturnValue(undefined);
jest.spyOn(cosmeticsModule, 'hasUserPaint').mockReturnValue(false);
jest
  .spyOn(cosmeticsModule, 'requestUserCosmeticsViaPresence')
  .mockResolvedValue(undefined);

// `@app/store/chat/react/selectors` and `@app/store/chat/observables/chatStore`
// are exercised for real: the selectors just read `chatStore$`, which starts
// at its documented defaults (empty messages, no caches), matching what the
// old stub returned. `chatStore$.messages` is reset in `beforeEach` below.

jest.spyOn(messagesModule, 'addMessage');
jest.spyOn(messagesModule, 'clearMessages');
jest.spyOn(messagesModule, 'moderateMessageById');
jest.spyOn(messagesModule, 'moderateMessagesByLogin');
jest.spyOn(messagesModule, 'getMaxChatMessages').mockReturnValue(600);
jest.spyOn(messagesModule, 'restoreRecentMessagesForChannel');

/**
 * SAFETY: only `chatScrollback`, `deletedMessageStyle`, `ignoreClearChat` and
 * `chatTimestampFormat` are read through the direct `getPreferences()` call
 * (message ingest + notice styling); every other preference this suite needs
 * goes through the hooks stubbed via `setPreferences` below instead.
 */
jest.spyOn(preferenceStoreModule, 'getPreferences').mockReturnValue({
  chatTimestampFormat: '24h',
  chatScrollback: 150,
  deletedMessageStyle: 'notice',
  ignoreClearChat: false,
} as ReturnType<typeof preferenceStoreModule.getPreferences>);
jest.spyOn(preferenceStoreModule, 'useChatRenderPreferences');
jest.spyOn(preferenceStoreModule, 'usePreference');
jest.spyOn(preferenceStoreModule, 'usePreferences');
jest.spyOn(preferenceStoreModule, 'useUpdatePreferences');

jest.spyOn(emoteProcessorModule, 'processEmotesWorklet').mockReturnValue([]);

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

// `__mocks__/expo-router.tsx` already stubs `useNavigation` with an
// equivalent (superset) shape, so no per-file override is needed here.

/**
 * `__mocks__/react-native-keyboard-controller.ts` stubs the animation hooks
 * this app actually uses elsewhere, but doesn't export `KeyboardStickyView` -
 * add it here since `Chat` docks its composer with it. The real export is a
 * `forwardRef` component (an object, not a function), and its named export is
 * read-only on the ES module namespace, so it is swapped via
 * `Object.defineProperty` rather than `jest.spyOn` or direct assignment.
 */
Object.defineProperty(keyboardControllerModule, 'KeyboardStickyView', {
  configurable: true,
  value: ({ children, ...props }: KeyboardStickyViewProps) => (
    <View {...props}>{children}</View>
  ),
});

// The package's top-level `useSafeAreaInsets` is a non-configurable
// re-export getter (jest.spyOn can't patch it); spy the submodule that
// actually defines it instead - the barrel forwards to it live.
jest
  .spyOn(safeAreaContextModule, 'useSafeAreaInsets')
  .mockReturnValue({ top: 0, right: 0, bottom: 0, left: 0 });

// `test/setupTests.ts` already mocks `sonner-native` globally with an
// equivalent (superset) `toast.success`, so no per-file override is needed.

const noRender = () => null;

/**
 * Each of these is `memo()` (or, for EmoteSheet, `forwardRef`-shaped)
 * wrapped - an object, not a function - so `jest.spyOn` cannot wrap it, and
 * its named export is read-only on the ES module namespace, so a plain
 * assignment cannot replace it either. `Object.defineProperty` swaps the
 * binding directly; this suite asserts how `Chat` orchestrates its children,
 * not what any of these children render.
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
Object.defineProperty(richChatMessageModule, 'RichChatMessage', {
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

const inertChatLifecycleResult = {
  hasPartedRef: { current: false },
  initializedChannelRef: { current: null },
  isMountedRef: { current: true },
  currentEmoteSetIdRef: { current: null },
} satisfies ReturnType<typeof useChatLifecycleModule.useChatLifecycle>;
jest
  .spyOn(useChatLifecycleModule, 'useChatLifecycle')
  .mockReturnValue(inertChatLifecycleResult);

jest.spyOn(useChatMessagesModule, 'useChatMessages');

const settledChatScrollResult = {
  isAtBottom: true,
  isScrollingToBottom: false,
  shouldMaintainScrollAtEnd: true,
  scrollAnchor: {
    isAtBottomRef: { current: true },
    isScrollingToBottomRef: { current: false },
    isUserActivelyScrolling: () => false,
    maintainBottomAfterContentChange: jest.fn(),
  },
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

/**
 * SAFETY: `useSeventvWs` (the only consumer of these callbacks) is itself
 * stubbed above, so it never invokes any of them - an empty object is a safe
 * stand-in for the full callback bag.
 */
jest
  .spyOn(createSevenTvCallbacksModule, 'createSevenTvCallbacks')
  .mockReturnValue(
    {} as ReturnType<
      typeof createSevenTvCallbacksModule.createSevenTvCallbacks
    >,
  );

jest
  .spyOn(useEmoteReprocessingModule, 'useEmoteReprocessing')
  .mockImplementation(() => {});

const mockedUsePreferences = jest.mocked(usePreferences);
const mockedUsePreference = jest.mocked(usePreference);
const mockedUseChatRenderPreferences = jest.mocked(useChatRenderPreferences);
const mockedUseUpdatePreferences = jest.mocked(useUpdatePreferences);
const mockedGetRecentMessages = jest.mocked(
  recentMessagesService.getRecentMessages,
);
const mockedUseChatMessages = jest.mocked(useChatMessages);
const mockedRestoreRecentMessagesForChannel = jest.mocked(
  restoreRecentMessagesForChannel,
);

const handleNewMessage = jest.fn();
const forceFlush = jest.fn();
const clearLocalMessages = jest.fn();
const moderateChatMessageById = jest.fn();
const moderateChatMessagesByLogin = jest.fn();
const removeChatMessageById = jest.fn();

const setPreferences = (showRecentMessages = true) => {
  const preferences = {
    updatedAt: 0,
    theme: 'foam-dark',
    hapticFeedback: true,
    streamListLayout: 'compact',
    chatDensity: 'compact',
    showAlternatingChatRows: false,
    animate: false,
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
    showJoinPartMessages: false,
    blockedTerms: [],
    chatTimestampFormat: '24h',
    chatFontScale: 'default',
    chatScrollback: 150,
    deletedMessageStyle: 'notice',
    ignoreClearChat: false,
    chatMentionHaptics: true,
    customHighlights: [],
    savedPhrases: [],
    shakeToReport: true,
    landscapeChatWidth: null,
    customPlayerEnabled: true,
    analyticsEnabled: true,
    sharedChatEnabled: true,
    enhancedVideoStability: false,
    chatDebugTools: false,
    sevenTvPaintRenderer: 'native',
    chatDelay: 'off',
    update: jest.fn(),
  } satisfies ReturnType<typeof usePreferences>;

  mockedUsePreferences.mockReturnValue(preferences);
  mockedUsePreference.mockImplementation(key => preferences[key]);
  mockedUseChatRenderPreferences.mockReturnValue(preferences);
  mockedUseUpdatePreferences.mockReturnValue(preferences.update);
};

describe('Chat recent messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRestoreRecentMessagesForChannel.mockReturnValue(0);
    chatStore$.messages.set([]);
    setPreferences();
    const chatMessages = {
      handleNewMessage,
      clearLocalMessages,
      reconcileChatDelay: jest.fn(),
      moderateChatMessageById,
      moderateChatMessagesByLogin,
      removeChatMessageById,
      removeChatMessagesByLogin: jest.fn(),
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
      getMaxChatMessages(),
    );
    const projectedCalls = handleNewMessage.mock.calls.map(
      ([message, options]) => ({
        channel: message.channel,
        id: 'id' in message ? message.id : undefined,
        message_id: message.message_id,
        options,
        sender: message.sender,
      }),
    );

    // The usernotice carries no IRC nonce, so its store id embeds the arrival
    // timestamp - pin the shape here, then compare everything else exactly.
    const noticeId = projectedCalls[1]?.id ?? '';
    expect(/^notice-1_\d+-\d+$/.test(noticeId)).toBe(true);

    expect(
      projectedCalls.map(entry =>
        entry.id === noticeId ? { ...entry, id: 'notice-1_nonce' } : entry,
      ),
    ).toEqual([
      {
        channel: 'foam',
        id: 'msg-1_msg-1',
        message_id: 'msg-1',
        options: { countUnread: false },
        sender: 'RecentUser',
      },
      {
        channel: 'foam',
        id: 'notice-1_nonce',
        message_id: 'notice-1',
        options: { countUnread: false },
        sender: 'SubUser',
      },
    ]);
    expect(moderateChatMessagesByLogin).toHaveBeenCalledWith(
      'baduser',
      'Timed out (600s)',
    );
    expect(moderateChatMessageById).toHaveBeenCalledWith('msg-1', 'Deleted');
    expect(moderateChatMessageById).toHaveBeenCalledWith('msg-2', 'Deleted');
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
