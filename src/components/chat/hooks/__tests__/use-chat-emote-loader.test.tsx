import type { ReactNode } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  createSevenTvEmote,
  createTwitchEmote,
} from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import { useChatEmoteLoader } from '@app/components/chat/hooks/use-chat-emote-loader';
import {
  createLoggedInAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import { AuthContextTestProvider } from '@app/context/AuthContext';
import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import { abortCurrentLoad } from '@app/store/chat/actions/channel-load';
import { clearGlobalResourceCache } from '@app/store/chat/actions/channel-resources';
import { clearMessages } from '@app/store/chat/actions/messages';
import { clearPersonalEmotesCache } from '@app/store/chat/actions/personal-emotes';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import { stubEmoteProviderServices } from '@app/test/emote-provider-services';
import { DefaultWrapper } from '@app/test/render';
import { silenceLogger } from '@app/test/silence-logger';
import * as preloadEmotesModule from '@app/utils/image/preloadEmotes';

const channelEmote = createSevenTvEmote({ id: 'channel-7tv', name: 'Wave' });
const loadedEmote = createSevenTvEmote({ id: 'loaded-7tv', name: 'Fresh' });

const mockPreloadChannelEmotes = jest
  .spyOn(preloadEmotesModule, 'preloadChannelEmotes')
  .mockResolvedValue(undefined);

const mockPreloadGlobalEmotes = jest
  .spyOn(preloadEmotesModule, 'preloadGlobalEmotes')
  .mockResolvedValue(undefined);

silenceLogger();

let mockGetChannelEmotes: jest.SpiedFunction<
  typeof twitchEmoteService.getChannelEmotes
>;

let mockGetEmoteSetId: jest.SpiedFunction<typeof sevenTvService.getEmoteSetId>;

function SignedInWrapper({ children }: { children: ReactNode }) {
  const authContext = createLoggedInAuthContextValue({
    user: createTestUser({ id: 'viewer-id' }),
  });

  return (
    <AuthContextTestProvider {...authContext}>
      {children}
    </AuthContextTestProvider>
  );
}

function seedFreshChannelCache() {
  const now = Date.now();

  chatStore$.persisted.channelCaches.set({
    'channel-1': {
      ...makeEmptyEmoteData(),
      lastUpdated: now,
      badgesLastUpdated: now,
      sevenTvEmoteSetId: 'set-1',
      sevenTvChannelEmotes: [channelEmote],
      twitchSubscriberEmotesUserId: 'viewer-id',
    },
  });

  chatStore$.persisted.globalCaches.set({
    ...makeEmptyGlobalCacheData(),
    lastUpdated: now,
    twitchGlobalEmotes: [createTwitchEmote({ id: 'global-twitch' })],
  });
}

function fakeProviderServices() {
  const providers = stubEmoteProviderServices();

  mockGetEmoteSetId = providers.getEmoteSetId.mockResolvedValue('set-2');
  providers.getSanitisedEmoteSet.mockResolvedValue([loadedEmote]);
  mockGetChannelEmotes = providers.getChannelEmotes;
}

const channelCache = () => chatStore$.persisted.channelCaches['channel-1'];

const preloadedChannelEmoteIds = () =>
  mockPreloadChannelEmotes.mock.calls.map(([emoteData]) =>
    (emoteData.sevenTvChannelEmotes ?? []).map(emote => emote.id),
  );

describe('useChatEmoteLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMessages();
    clearPersonalEmotesCache();
    clearGlobalResourceCache();
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    fakeProviderServices();
    seedFreshChannelCache();
  });

  test('loads the cached channel on mount and preloads its emotes', async () => {
    const { result } = renderHook(
      () => useChatEmoteLoader({ channelId: 'channel-1' }),
      { wrapper: SignedInWrapper },
    );

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.sevenTvEmoteSetId).toBe('set-1');

    expect(chatStore$.currentChannelId.peek()).toBe('channel-1');

    expect(mockGetChannelEmotes).not.toHaveBeenCalled();

    expect(mockPreloadGlobalEmotes).toHaveBeenCalledTimes(1);

    expect(preloadedChannelEmoteIds()).toEqual([['channel-7tv']]);
  });

  test('does not load without a channel id', () => {
    const { result } = renderHook(() => useChatEmoteLoader({ channelId: '' }), {
      wrapper: SignedInWrapper,
    });

    expect(result.current.status).toBe('idle');

    expect(chatStore$.loadingState.peek()).toBe('IDLE');
  });

  test('refetch downloads the channel again for the signed-in viewer', async () => {
    const { result } = renderHook(
      () => useChatEmoteLoader({ channelId: 'channel-1' }),
      { wrapper: SignedInWrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.status).toBe('success');

    expect(mockGetChannelEmotes.mock.calls).toEqual([['channel-1']]);

    expect({
      sevenTvEmoteSetId: channelCache()?.sevenTvEmoteSetId.peek(),
      sevenTvChannelEmoteIds: channelCache()
        ?.sevenTvChannelEmotes.peek()
        .map(emote => emote.id),
      twitchSubscriberEmotesUserId:
        channelCache()?.twitchSubscriberEmotesUserId.peek(),
    }).toEqual({
      sevenTvEmoteSetId: 'set-2',
      sevenTvChannelEmoteIds: ['loaded-7tv'],
      twitchSubscriberEmotesUserId: 'viewer-id',
    });
  });

  test('loads without a subscriber user id for an anonymous viewer', async () => {
    const { result } = renderHook(
      () => useChatEmoteLoader({ channelId: 'channel-1' }),
      { wrapper: DefaultWrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.status).toBe('success');

    expect(channelCache()?.twitchSubscriberEmotesUserId.peek()).toBeUndefined();
  });

  test('force-refetches the active channel when the cosmetics cache is cleared', async () => {
    const { result } = renderHook(
      () => useChatEmoteLoader({ channelId: 'channel-1' }),
      { wrapper: SignedInWrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(mockGetChannelEmotes).not.toHaveBeenCalled();

    act(() => {
      chatStore$.cosmeticsCacheVersion.set(version => version + 1);
    });

    await waitFor(() => {
      expect(mockGetChannelEmotes.mock.calls).toEqual([['channel-1']]);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  test('force-refetches when the active channel cache disappears without a version bump', async () => {
    const { result, rerender } = renderHook(
      ({ channelId }: { channelId: string }) =>
        useChatEmoteLoader({ channelId }),
      { initialProps: { channelId: 'channel-1' }, wrapper: SignedInWrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(mockGetChannelEmotes).not.toHaveBeenCalled();

    chatStore$.persisted.channelCaches.set({});

    rerender({ channelId: '' });
    rerender({ channelId: 'channel-1' });

    await waitFor(() => {
      expect(mockGetChannelEmotes.mock.calls).toEqual([['channel-1']]);
    });

    await waitFor(() => {
      expect(channelCache()?.sevenTvEmoteSetId.peek()).toBe('set-2');
    });
  });

  test('cancel stops the active load before it writes the channel cache', async () => {
    chatStore$.persisted.channelCaches.set({});

    let resolveEmoteSetId: (setId: string) => void = () => {};

    mockGetEmoteSetId.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveEmoteSetId = resolve;
        }),
    );

    const { result } = renderHook(
      () => useChatEmoteLoader({ channelId: 'channel-1' }),
      { wrapper: SignedInWrapper },
    );

    await waitFor(() => {
      expect(mockGetChannelEmotes).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      resolveEmoteSetId('set-2');
    });

    expect(result.current.status).toBe('cancelled');

    expect(channelCache()?.peek()).toBeUndefined();

    expect(chatStore$.loadingState.peek()).toBe('IDLE');
  });

  test('reports error and posts a system message when the load throws', async () => {
    chatStore$.persisted.channelCaches.set({});

    mockGetEmoteSetId.mockImplementation(() => {
      throw new Error('7TV is down');
    });

    const { result } = renderHook(
      () => useChatEmoteLoader({ channelId: 'channel-1' }),
      { wrapper: SignedInWrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(chatStore$.loadingState.peek()).toBe('ERROR');

    expect(
      chatStore$.messages.peek().map(message => message.message[0]),
    ).toEqual([
      {
        type: 'text',
        content: "Couldn't load channel emotes and badges. Try refreshing.",
      },
    ]);
  });

  test('reports cancelled and skips the preload when the load is aborted before completion', async () => {
    mockGetChannelEmotes.mockImplementation(async () => {
      abortCurrentLoad();
      return [];
    });

    const { result } = renderHook(
      () => useChatEmoteLoader({ channelId: 'channel-1' }),
      { wrapper: SignedInWrapper },
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    mockPreloadGlobalEmotes.mockClear();
    mockPreloadChannelEmotes.mockClear();

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.status).toBe('cancelled');

    expect(mockPreloadGlobalEmotes).not.toHaveBeenCalled();

    expect(mockPreloadChannelEmotes).not.toHaveBeenCalled();
  });
});

afterEach(flushChatStoreTimers);
