import { act, renderHook, waitFor } from '@testing-library/react-native';

import { hydrateVisibleSevenTvAssets } from '@app/components/Chat/util/hydrateVisibleSevenTvAssets/hydrateVisibleSevenTvAssets';
import {
  fetchUserPersonalEmotes,
  getCurrentEmoteData,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/channelLoad';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import { updateMessages } from '@app/store/chat/actions/messages';
import { fetchUserCosmetics } from '@app/store/chat/actions/userCosmeticsFetch';
import { visibleAssetHydration } from '@app/store/chat/actions/visibleAssetHydration';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { usePersonalEmotesVersion } from '@app/store/chat/react/selectors';
import { useChatHydrationPreferences } from '@app/store/preferences/selectors';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { extractEmotesFromTag } from '@app/utils/chat/extractEmotes/extractEmotesFromTag';
import { getCachedSharedChatBadgeContext } from '@app/utils/chat/sharedChatBadges/getCachedSharedChatBadgeContext';
import { getMessageBadges } from '@app/utils/chat/sharedChatBadges/getMessageBadges';
import { getSharedChatBadgeContext } from '@app/utils/chat/sharedChatBadges/getSharedChatBadgeContext';

import { useChatMessageProcessing } from '../useChatMessageProcessing';
import {
  createBadge,
  createChatMessage,
  createEmoteData,
  createSevenTvEmote,
  createTwitchEmote,
} from './__fixtures__/useChat.fixture';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  fetchUserPersonalEmotes: jest.fn(() => Promise.resolve([])),
  getCurrentEmoteData: jest.fn(),
  getUserPersonalEmotes: jest.fn(() => []),
}));

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  getUserBadge: jest.fn(),
}));

jest.mock('@app/store/chat/actions/messages', () => ({
  updateMessages: jest.fn(),
}));

jest.mock('@app/store/chat/actions/userCosmeticsFetch', () => ({
  fetchUserCosmetics: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    emojis: {
      peek: jest.fn(() => []),
    },
  },
}));

jest.mock('@app/store/chat/react/selectors', () => ({
  usePersonalEmotesVersion: jest.fn(() => 0),
}));

jest.mock('@app/store/preferences/selectors', () => ({
  useChatHydrationPreferences: jest.fn(),
}));

jest.mock('@app/utils/chat/emoteProcessor', () => ({
  processEmotesWorklet: jest.fn((params: { inputString: string }) => [
    { type: 'text', content: `processed:${params.inputString}` },
  ]),
}));

jest.mock('@app/utils/chat/extractEmotes/extractEmotesFromTag', () => ({
  extractEmotesFromTag: jest.fn(() => []),
}));

jest.mock(
  '../../util/hydrateVisibleSevenTvAssets/hydrateVisibleSevenTvAssets',
  () => ({
    hydrateVisibleSevenTvAssets: jest.fn(() => Promise.resolve(false)),
  }),
);

jest.mock(
  '@app/utils/chat/sharedChatBadges/getCachedSharedChatBadgeContext',
  () => ({
    getCachedSharedChatBadgeContext: jest.fn(),
  }),
);

jest.mock('@app/utils/chat/sharedChatBadges/getMessageBadges', () => ({
  getMessageBadges: jest.fn(() => []),
}));

jest.mock('@app/utils/chat/sharedChatBadges/getSharedChatBadgeContext', () => ({
  getSharedChatBadgeContext: jest.fn(() =>
    Promise.resolve({
      sourceBadge: undefined,
      sourceChannelBadges: [],
    }),
  ),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
      error: jest.fn(),
    },
  },
}));

const mockEmojisPeek = jest.mocked(chatStore$.emojis.peek);
const mockExtractEmotesFromTag = jest.mocked(extractEmotesFromTag);
const mockFetchUserPersonalEmotes = jest.mocked(fetchUserPersonalEmotes);
const mockGetCachedSharedChatBadgeContext = jest.mocked(
  getCachedSharedChatBadgeContext,
);
const mockGetCurrentEmoteData = jest.mocked(getCurrentEmoteData);
const mockGetMessageBadges = jest.mocked(getMessageBadges);
const mockGetSharedChatBadgeContext = jest.mocked(getSharedChatBadgeContext);
const mockGetUserBadge = jest.mocked(getUserBadge);
const mockGetUserPersonalEmotes = jest.mocked(getUserPersonalEmotes);
const mockHydrateVisibleSevenTvAssets = jest.mocked(
  hydrateVisibleSevenTvAssets,
);
const mockProcessEmotesWorklet = jest.mocked(processEmotesWorklet);
const mockUpdateMessages = jest.mocked(updateMessages);
const mockUseChatHydrationPreferences = jest.mocked(
  useChatHydrationPreferences,
);
const mockUsePersonalEmotesVersion = jest.mocked(usePersonalEmotesVersion);

function renderMessageProcessing() {
  const handleNewMessage = jest.fn();
  const maintainBottomAfterContentChange = jest.fn();
  const messages = [
    createChatMessage({
      tags: {
        id: 'stored-1',
      },
      text: 'stored message',
    }),
  ];
  const isAtBottomRef = { current: true };

  const hook = renderHook(() =>
    useChatMessageProcessing({
      channelId: 'channel-1',
      handleNewMessage,
      messages$: {
        peek: jest.fn(() => messages),
      },
      scrollAnchor: {
        isAtBottomRef,
        isScrollingToBottomRef: { current: false },
        isUserActivelyScrolling: () => false,
        maintainBottomAfterContentChange,
      },
      show7TvEmotes: true,
      show7tvBadges: true,
      userLogin: 'viewer',
    }),
  );

  return {
    handleNewMessage,
    hook,
    maintainBottomAfterContentChange,
    messages,
    isAtBottomRef,
  };
}

describe('useChatMessageProcessing', () => {
  const sevenTvEmote = createSevenTvEmote();
  const personalEmote = createSevenTvEmote({
    id: 'personal-1',
    name: 'Personal',
    site: '7TV Channel',
  });
  const taggedSubscriberEmote = createTwitchEmote({
    id: 'tagged-1',
    name: 'SubTagged',
    site: 'Twitch Subscriber',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUsePersonalEmotesVersion.mockReturnValue(0);
    mockUseChatHydrationPreferences.mockReturnValue({
      disableEmoteAnimations: true,
      show7TvEmotes: true,
      show7tvBadges: true,
    });
    mockGetCurrentEmoteData.mockReturnValue(
      createEmoteData({
        sevenTvChannelEmotes: [sevenTvEmote],
        twitchSubscriberEmotes: [
          createTwitchEmote({
            id: 'subscriber-1',
            name: 'SubOnly',
            site: 'Twitch Subscriber',
          }),
        ],
      }),
    );
    mockGetUserPersonalEmotes.mockReturnValue([personalEmote]);
    mockExtractEmotesFromTag.mockReturnValue([taggedSubscriberEmote]);
    mockEmojisPeek.mockReturnValue([
      createSevenTvEmote({
        id: 'emoji-1',
        name: '😀',
        site: '7TV Channel',
      }),
    ]);
    mockGetMessageBadges.mockReturnValue([
      createBadge({ id: '12', url: 'badge.png' }),
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('processes a live IRC message with personal, tagged, and subscriber emotes', async () => {
    mockGetCachedSharedChatBadgeContext.mockReturnValue({
      isComplete: false,
      sourceBadge: createBadge({
        set: 'shared-chat-source',
        id: 'source',
        url: 's.png',
        type: 'Twitch Channel Badge',
        title: 'Shared chat source',
      }),
      sourceChannelBadges: [],
    });
    mockGetSharedChatBadgeContext.mockResolvedValue({
      sourceBadge: createBadge({
        set: 'shared-chat-source',
        id: 'updated',
        url: 'u.png',
        type: 'Twitch Channel Badge',
        title: 'Shared chat source',
      }),
      sourceChannelBadges: [],
    });
    const baseMessage = createChatMessage({
      tags: {
        emotes: '25:0-4',
        id: 'msg-1',
        login: 'viewer',
        'display-name': 'Viewer',
        'user-id': 'viewer-id',
      },
      text: 'Kappa hello',
    });
    const { handleNewMessage, hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.processMessageEmotes(
        'Kappa hello',
        baseMessage.userstate,
        baseMessage,
        'viewer-id',
        false,
      );
    });

    const processorParams = mockProcessEmotesWorklet.mock.calls[0]?.[0];
    expect({
      inputString: processorParams?.inputString,
      sevenTvPersonalEmotes: processorParams?.sevenTvPersonalEmotes,
      twitchSubscriberEmotes: processorParams?.twitchSubscriberEmotes,
      userstate: processorParams?.userstate,
    }).toEqual({
      inputString: 'Kappa hello',
      sevenTvPersonalEmotes: [personalEmote],
      twitchSubscriberEmotes: [
        taggedSubscriberEmote,
        createTwitchEmote({
          id: 'subscriber-1',
          name: 'SubOnly',
          site: 'Twitch Subscriber',
        }),
      ],
      userstate: baseMessage.userstate,
    });
    expect(handleNewMessage.mock.calls[0]).toEqual([
      {
        ...baseMessage,
        badges: [createBadge({ id: '12', url: 'badge.png' })],
        message: [{ type: 'text', content: 'processed:Kappa hello' }],
      },
      { countUnread: false },
    ]);

    await waitFor(() => {
      expect(mockUpdateMessages.mock.calls[0]?.[0]).toEqual([
        {
          messageId: 'msg-1',
          messageNonce: 'msg-1',
          updates: {
            badges: [createBadge({ id: '12', url: 'badge.png' })],
          },
        },
      ]);
    });
  });

  test('falls back to the base message when no channel emote data is available', () => {
    mockGetCurrentEmoteData.mockReturnValue(createEmoteData());
    mockEmojisPeek.mockReturnValue([]);
    const baseMessage = createChatMessage();
    const { handleNewMessage, hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.processMessageEmotes(
        'hello',
        baseMessage.userstate,
        baseMessage,
      );
    });

    expect(handleNewMessage.mock.calls[0]).toEqual([
      baseMessage,
      { countUnread: true },
    ]);
    expect(mockProcessEmotesWorklet).not.toHaveBeenCalled();
  });

  test('debounces visible message hydration and maintains bottom anchoring when visible messages are reprocessed', async () => {
    jest.useFakeTimers();
    mockHydrateVisibleSevenTvAssets.mockResolvedValue(true);
    const visibleMessage = createChatMessage({
      tags: {
        id: 'visible-1',
        'user-id': 'visible-user',
      },
      text: 'visible OMEGALUL',
    });
    const { hook, maintainBottomAfterContentChange } =
      renderMessageProcessing();

    act(() => {
      hook.result.current.handleViewableMessagesChange([visibleMessage]);
      hook.result.current.handleViewableMessagesChange([
        visibleMessage,
        createChatMessage({
          tags: {
            id: 'visible-2',
          },
        }),
      ]);
    });

    expect(mockHydrateVisibleSevenTvAssets).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(150);
      await Promise.resolve();
    });

    const hydrateParams = mockHydrateVisibleSevenTvAssets.mock.calls[0]?.[0];
    expect({
      channelId: hydrateParams?.channelId,
      fetchUserCosmetics: hydrateParams?.fetchUserCosmetics,
      hydrateCosmetics: hydrateParams?.hydrateCosmetics,
      hydratePersonalEmotes: hydrateParams?.hydratePersonalEmotes,
      messages: hydrateParams?.messages.map(message => message.message_id),
    }).toEqual({
      channelId: 'channel-1',
      fetchUserCosmetics,
      hydrateCosmetics: true,
      hydratePersonalEmotes: true,
      messages: ['visible-1', 'visible-2'],
    });
    expect(visibleAssetHydration.pendingMessages).toEqual([]);
    expect(maintainBottomAfterContentChange).toHaveBeenCalledTimes(1);
  });

  test('re-hydrates the currently visible messages when the personal emotes version bumps', async () => {
    jest.useFakeTimers();
    const visibleMessage = createChatMessage({
      tags: {
        id: 'visible-1',
        'user-id': 'visible-user',
      },
      text: 'visible OMEGALUL',
    });
    const { hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.handleViewableMessagesChange([visibleMessage]);
    });
    await act(async () => {
      jest.advanceTimersByTime(150);
      await Promise.resolve();
    });

    expect(mockHydrateVisibleSevenTvAssets).toHaveBeenCalledTimes(1);
    visibleAssetHydration.hydratedMessageKeys.add('stale-hydration-key');

    mockUsePersonalEmotesVersion.mockReturnValue(1);
    act(() => {
      hook.rerender(undefined);
    });

    expect(visibleAssetHydration.hydratedMessageKeys).toEqual(new Set());

    await act(async () => {
      jest.advanceTimersByTime(150);
      await Promise.resolve();
    });

    expect(mockHydrateVisibleSevenTvAssets).toHaveBeenCalledTimes(2);
    expect(
      mockHydrateVisibleSevenTvAssets.mock.calls[1]?.[0]?.messages.map(
        message => message.message_id,
      ),
    ).toEqual(['visible-1']);
  });

  test('does not schedule a hydration pass for the mount-time personal emotes version', () => {
    jest.useFakeTimers();
    renderMessageProcessing();

    expect(visibleAssetHydration.timer).toBeNull();

    jest.advanceTimersByTime(150);

    expect(mockHydrateVisibleSevenTvAssets).not.toHaveBeenCalled();
  });

  test('reprocessAllMessages rewrites the buffered store snapshot through updateMessages', () => {
    const { hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.reprocessAllMessages();
    });

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessages).toHaveBeenCalledWith([
      {
        messageId: 'stored-1',
        messageNonce: 'stored-1',
        updates: {
          message: [{ type: 'text', content: 'processed:stored message' }],
          badges: [],
        },
      },
    ]);
  });

  test('a channel switch cancels an in-flight reprocess walk', () => {
    jest.useFakeTimers();
    const messages = Array.from({ length: 8 }, (_, index) =>
      createChatMessage({
        tags: { id: `stored-${index}` },
        text: `stored message ${index}`,
      }),
    );
    const hook = renderHook(
      ({ channelId }: { channelId: string }) =>
        useChatMessageProcessing({
          channelId,
          handleNewMessage: jest.fn(),
          messages$: {
            peek: () => messages,
          },
          scrollAnchor: {
            isAtBottomRef: { current: true },
            isScrollingToBottomRef: { current: false },
            isUserActivelyScrolling: () => false,
            maintainBottomAfterContentChange: jest.fn(),
          },
          show7TvEmotes: true,
          show7tvBadges: true,
          userLogin: 'viewer',
        }),
      { initialProps: { channelId: 'channel-1' } },
    );

    act(() => {
      hook.result.current.reprocessAllMessages();
    });

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);

    hook.rerender({ channelId: 'channel-2' });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
  });

  test('passes hydration dependencies used by visible asset loading', async () => {
    jest.useFakeTimers();
    const visibleMessage = createChatMessage({
      tags: {
        id: 'visible-deps',
      },
    });
    const { hook } = renderMessageProcessing();

    act(() => {
      hook.result.current.handleViewableMessagesChange([visibleMessage]);
    });

    await act(async () => {
      jest.advanceTimersByTime(150);
      await Promise.resolve();
    });

    const hydrateParams = mockHydrateVisibleSevenTvAssets.mock.calls[0]?.[0];
    expect({
      fetchUserPersonalEmotes: hydrateParams?.fetchUserPersonalEmotes,
      getUserBadge: hydrateParams?.getUserBadge('user-1'),
      getUserPersonalEmotes: hydrateParams?.getUserPersonalEmotes(
        'user-1',
        'channel-1',
      ),
    }).toEqual({
      fetchUserPersonalEmotes: mockFetchUserPersonalEmotes,
      getUserBadge: null,
      getUserPersonalEmotes: [personalEmote],
    });
    expect(mockGetUserBadge).toHaveBeenCalledWith('user-1');
  });
});
