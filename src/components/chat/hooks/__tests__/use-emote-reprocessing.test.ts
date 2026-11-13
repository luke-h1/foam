import { act, renderHook } from '@testing-library/react-native';

import {
  createSevenTvEmote,
  createTwitchEmote,
} from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import type { EmoteLoadingStatus } from '@app/components/chat/hooks/use-chat-emote-loader';
import { useEmoteReprocessing } from '@app/components/chat/hooks/use-emote-reprocessing';
import type { ChatMessagesSource } from '@app/components/chat/types/chat-messages-source';
import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import { MAX_FILTERED_EMOTE_NAMES } from '@app/components/chat/util/pickEmoteReprocessScope';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { sevenTvService } from '@app/services/seven-tv-service';
import {
  storedTokens,
  type TokenSummary,
} from '@app/store/chat/__tests__/__fixtures__/messages.fixture';
import { addMessages, clearMessages } from '@app/store/chat/actions/messages';
import * as personalEmotes from '@app/store/chat/actions/personal-emotes';
import {
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import * as resolveTokensModule from '@app/store/chat/actions/resolveMessageEmoteTokens';
import { updateSevenTvEmotes } from '@app/store/chat/actions/seven-tv-channel-lifecycle';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { useChannelEmoteDataForReprocess } from '@app/store/chat/react/selectors';
import {
  type ChannelCacheType,
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';

const channelId = 'channel-1';

const kappa = createSevenTvEmote({
  id: 'kappa-id',
  name: 'Kappa',
  original_name: 'Kappa',
  url: 'https://cdn.example.test/kappa.webp',
});

/**
 * A message that reached the store without a userstate, which the enrichment
 * pass has to skip rather than reprocess.
 */
interface MessageWithoutUserstate extends Omit<
  AnyChatMessageType,
  'userstate'
> {
  userstate: undefined;
}

function createTextOnlyMessage(
  messageId: string,
  text: string,
  login = 'user',
): AnyChatMessageType {
  return createChatMessageFixture({
    id: messageId,
    message_id: messageId,
    message_nonce: `nonce-${messageId}`,
    message: [{ type: 'text', content: text }],
    sender: login,
    userstate: createUserStateTags({
      'display-name': login,
      login,
      username: login,
      'user-id': '1',
      id: messageId,
      color: '#fff',
    }),
  });
}

function seedChannelCache(overrides: Partial<ChannelCacheType> = {}) {
  chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());

  chatStore$.persisted.channelCaches.set({
    [channelId]: { ...makeEmptyEmoteData(), ...overrides },
  });
}

const resolvedKappa: TokenSummary = {
  type: 'emote',
  content: 'Kappa',
  url: 'https://cdn.example.test/kappa.webp',
};

interface RenderReprocessOptions {
  emoteLoadStatus?: EmoteLoadingStatus;
  messages$?: ChatMessagesSource;
  processedMessageIds?: Set<string>;
  show7TvEmotes?: boolean;
  userLogin?: string;
}

function renderReprocess({
  emoteLoadStatus = 'success',
  messages$ = chatStore$.messages,
  processedMessageIds = new Set<string>(),
  show7TvEmotes = true,
  userLogin,
}: RenderReprocessOptions = {}) {
  const processedMessageIdsRef = { current: processedMessageIds };

  renderHook(() =>
    useEmoteReprocessing({
      channelId,
      channelEmoteData: {},
      messages$,
      emoteLoadStatus,
      processedMessageIdsRef,
      show7TvEmotes,
      showChatGifs: false,
      userLogin,
    }),
  );

  return processedMessageIdsRef;
}

describe('useEmoteReprocessing', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearMessages();
    clearPersonalEmotesCache();
    chatStore$.emojis.set([]);
    chatStore$.persisted.channelCaches.set({});

    jest
      .spyOn(bttvEmoteService, 'getSanitisedGlobalBadges')
      .mockResolvedValue([]);
  });

  test('does nothing when emoteLoadStatus is not success', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });
    addMessages([createTextOnlyMessage('msg-1', 'Kappa')]);

    renderReprocess({ emoteLoadStatus: 'loading' });

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'Kappa' },
    ]);
  });

  test('does nothing when there are no emotes and 7TV emotes are disabled', () => {
    seedChannelCache();

    addMessages([
      {
        ...createTextOnlyMessage('msg-1', 'Kappa'),
        message: [{ type: 'emote', content: 'Kappa', id: 'stale', url: '' }],
      },
    ]);

    renderReprocess({ show7TvEmotes: false });

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'emote', content: 'Kappa', url: '' },
    ]);
  });

  test('still reprocesses a personal-emote-only channel when 7TV emotes are enabled', async () => {
    // Personal 7TV emotes live outside the channel emote data, so an empty
    // channel set must not gate the reprocess pass off when 7TV is enabled.
    seedChannelCache();

    jest
      .spyOn(sevenTvService, 'getPersonalEmoteSet')
      .mockResolvedValue([
        createSevenTvEmote({ id: 'plaska-id', name: 'plaska', url: 'p.webp' }),
      ]);

    await fetchUserPersonalEmotes('1', channelId);
    addMessages([createTextOnlyMessage('msg-1', 'plaska')]);

    renderReprocess();

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'emote', content: 'plaska', url: 'p.webp' },
    ]);
  });

  test('keeps a resolved personal emote as an emote on reprocess', async () => {
    seedChannelCache();

    jest
      .spyOn(sevenTvService, 'getPersonalEmoteSet')
      .mockResolvedValue([
        createSevenTvEmote({ id: 'plaska-id', name: 'plaska', url: 'p.webp' }),
      ]);

    await fetchUserPersonalEmotes('1', channelId);

    addMessages([
      {
        ...createTextOnlyMessage('msg-1', 'plaska'),
        message: [
          { type: 'emote', content: 'plaska', id: 'plaska-id', url: 'p.webp' },
        ],
      },
    ]);

    renderReprocess();

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'emote', content: 'plaska', url: 'p.webp' },
    ]);
  });

  test('downgrades a personal emote to text when 7TV emotes are turned off', async () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });

    jest
      .spyOn(sevenTvService, 'getPersonalEmoteSet')
      .mockResolvedValue([
        createSevenTvEmote({ id: 'plaska-id', name: 'plaska', url: 'p.webp' }),
      ]);

    await fetchUserPersonalEmotes('1', channelId);

    addMessages([
      {
        ...createTextOnlyMessage('msg-1', 'plaska'),
        message: [
          { type: 'emote', content: 'plaska', id: 'plaska-id', url: 'p.webp' },
        ],
      },
    ]);

    renderReprocess({ show7TvEmotes: false });

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'plaska' },
    ]);
  });

  test('reprocesses text-only unprocessed messages into emote tokens', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });
    addMessages([createTextOnlyMessage('msg-1', 'hello Kappa')]);

    const processedMessageIdsRef = renderReprocess();

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'hello' },
      { type: 'text', content: ' ' },
      resolvedKappa,
    ]);

    expect(processedMessageIdsRef.current).toEqual(new Set(['msg-1']));
  });

  test('resolves subscriber emotes only for messages the signed-in user sent', () => {
    seedChannelCache({
      twitchSubscriberEmotes: [
        createTwitchEmote({ id: 'sub-id', name: 'SubHype', url: 's.webp' }),
      ],
    });

    addMessages([
      createTextOnlyMessage('mine', 'SubHype', 'me'),
      createTextOnlyMessage('theirs', 'SubHype', 'someone'),
    ]);

    renderReprocess({ userLogin: 'me' });

    expect({
      mine: storedTokens('mine'),
      theirs: storedTokens('theirs'),
    }).toEqual<Record<string, TokenSummary[]>>({
      mine: [{ type: 'emote', content: 'SubHype', url: 's.webp' }],
      theirs: [{ type: 'text', content: 'SubHype' }],
    });
  });

  test('leaves the store untouched when the tokens already match', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });
    addMessages([createTextOnlyMessage('msg-1', 'Kappa')]);

    renderReprocess();

    const messagesAfterFirstPass = chatStore$.messages.peek();
    const processedMessageIdsRef = renderReprocess();

    expect(chatStore$.messages.peek()).toBe(messagesAfterFirstPass);

    expect(processedMessageIdsRef.current).toEqual(new Set(['msg-1']));
  });

  test('skips sparse or incomplete message entries', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });

    const validMessage = createTextOnlyMessage('msg-1', 'Kappa');
    addMessages([validMessage]);

    const peek = jest
      .fn()
      .mockReturnValue([
        undefined,
        { message_id: '', message: [] },
        { message_id: 'bad', message: undefined },
        validMessage,
      ]);

    renderReprocess({ messages$: { peek } });

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([resolvedKappa]);
  });

  test('skips messages without a userstate', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });
    addMessages([createTextOnlyMessage('msg-1', 'Kappa')]);

    const noUserstate: MessageWithoutUserstate = {
      ...createTextOnlyMessage('msg-1', 'Kappa'),
      userstate: undefined,
    };

    renderReprocess({
      messages$: { peek: jest.fn().mockReturnValue([noUserstate]) },
    });

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'Kappa' },
    ]);
  });

  test('reprocesses stored messages when showChatGifs changes', () => {
    const gifAlt = '[YAY GIF]';
    const gifsTag = `0-${gifAlt.length - 1}|abc|https://example.com/a.gif`;

    seedChannelCache({ sevenTvChannelEmotes: [kappa] });

    addMessages([
      {
        ...createTextOnlyMessage('msg-1', gifAlt),
        userstate: {
          ...createTextOnlyMessage('msg-1', gifAlt).userstate,
          gifs: gifsTag,
        },
        message: [{ type: 'text', content: gifAlt }],
      },
    ]);

    const processedMessageIdsRef = { current: new Set(['msg-1']) };

    const { rerender } = renderHook(
      ({ showChatGifs }: { showChatGifs: boolean }) =>
        useEmoteReprocessing({
          channelId,
          channelEmoteData: {},
          messages$: chatStore$.messages,
          emoteLoadStatus: 'success',
          processedMessageIdsRef,
          show7TvEmotes: true,
          showChatGifs,
        }),
      { initialProps: { showChatGifs: false } },
    );

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: gifAlt },
    ]);

    rerender({ showChatGifs: true });

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'gif', content: gifAlt },
    ]);
  });

  test('reprocesses existing emote tokens when reprocessKey changes', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });

    addMessages([
      {
        ...createTextOnlyMessage('msg-1', 'hi Kappa'),
        message: [
          { type: 'text', content: 'hi ' },
          { type: 'emote', content: 'Kappa', id: 'stale', url: '' },
        ],
      },
    ]);

    const processedMessageIdsRef = { current: new Set(['msg-1']) };

    const { rerender } = renderHook(
      ({ reprocessKey }: { reprocessKey: string }) =>
        useEmoteReprocessing({
          channelId,
          channelEmoteData: {},
          messages$: chatStore$.messages,
          emoteLoadStatus: 'success',
          processedMessageIdsRef,
          reprocessKey,
          show7TvEmotes: true,
          showChatGifs: false,
        }),
      { initialProps: { reprocessKey: 'twitter' } },
    );

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'hi ' },
      { type: 'emote', content: 'Kappa', url: '' },
    ]);

    rerender({ reprocessKey: 'google' });

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'hi' },
      { type: 'text', content: ' ' },
      resolvedKappa,
    ]);
  });

  test('skips messages with non-chat content tokens', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });

    addMessages([
      {
        ...createTextOnlyMessage('msg-1', 'Kappa'),
        message: [{ type: 'twitchClip', content: 'Kappa' }],
      },
    ]);

    renderReprocess();

    expect(storedTokens('msg-1')).toEqual<TokenSummary[]>([
      { type: 'twitchClip', content: 'Kappa' },
    ]);
  });
});

describe('useEmoteReprocessing after a live 7TV emote_set.update', () => {
  const newHype = createSevenTvEmote({
    id: 'new-hype-id',
    name: 'NewHype',
    original_name: 'NewHype',
    url: 'https://cdn.example.test/new-hype.webp',
  });

  const resolvedNewHype: TokenSummary = {
    type: 'emote',
    content: 'NewHype',
    url: 'https://cdn.example.test/new-hype.webp',
  };

  function createKappaMessage(messageId: string): AnyChatMessageType {
    return {
      ...createTextOnlyMessage(messageId, 'Kappa'),
      message: [
        {
          type: 'emote',
          content: 'Kappa',
          id: kappa.id,
          name: kappa.name,
          url: kappa.url,
        },
      ],
    };
  }

  function useLiveReprocess(processedMessageIds: Set<string>) {
    const channelEmoteData = useChannelEmoteDataForReprocess(channelId);

    useEmoteReprocessing({
      channelId,
      channelEmoteData,
      messages$: chatStore$.messages,
      emoteLoadStatus: 'success',
      processedMessageIdsRef: { current: processedMessageIds },
      reprocessKey: 'key',
      show7TvEmotes: true,
      showChatGifs: false,
    });
  }

  function renderLiveReprocess(processedMessageIds = new Set<string>()) {
    renderHook(() => useLiveReprocess(processedMessageIds));
  }

  function storedById(): Map<string, AnyChatMessageType> {
    return new Map(
      chatStore$.messages.peek().map(message => [message.message_id, message]),
    );
  }

  beforeEach(() => {
    clearMessages();
    chatStore$.emojis.set([]);
    jest.spyOn(personalEmotes, 'getUserPersonalEmotes').mockReturnValue([]);

    jest
      .spyOn(bttvEmoteService, 'getSanitisedGlobalBadges')
      .mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolves an added emote only in the rows that hold its name', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });
    renderLiveReprocess();

    addMessages([
      createTextOnlyMessage('hype', 'lets go NewHype'),
      createTextOnlyMessage('plain', 'hello there'),
      createKappaMessage('kappa'),
    ]);

    const before = storedById();
    const resolveSpy = jest.spyOn(
      resolveTokensModule,
      'resolveMessageEmoteTokens',
    );

    act(() => {
      updateSevenTvEmotes(channelId, [newHype], []);
    });

    const after = storedById();

    expect({
      resolveCalls: resolveSpy.mock.calls.length,
      hype: storedTokens('hype'),
    }).toEqual<{ resolveCalls: number; hype: TokenSummary[] }>({
      resolveCalls: 1,
      hype: [
        { type: 'text', content: 'lets' },
        { type: 'text', content: ' ' },
        { type: 'text', content: 'go' },
        { type: 'text', content: ' ' },
        resolvedNewHype,
      ],
    });

    expect(after.get('plain')).toBe(before.get('plain'));

    expect(after.get('plain')?.message).toBe(before.get('plain')?.message);

    expect(after.get('kappa')).toBe(before.get('kappa'));

    expect(after.get('kappa')?.message).toBe(before.get('kappa')?.message);
  });

  test('reverts a removed emote to text only in the rows that hold it', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa, newHype] });
    renderLiveReprocess();

    addMessages([
      createKappaMessage('kappa'),
      createTextOnlyMessage('plain', 'hello there'),
    ]);

    const before = storedById();

    act(() => {
      updateSevenTvEmotes(channelId, [], [kappa]);
    });

    const after = storedById();

    expect(storedTokens('kappa')).toEqual<TokenSummary[]>([
      { type: 'text', content: 'Kappa' },
    ]);

    expect(after.get('plain')).toBe(before.get('plain'));

    expect(after.get('plain')?.message).toBe(before.get('plain')?.message);
  });

  test('re-resolves the rows that hold the old or the new name of a rename', () => {
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });
    renderLiveReprocess();

    addMessages([
      createKappaMessage('old-name'),
      createTextOnlyMessage('new-name', 'KappaPride'),
      createTextOnlyMessage('plain', 'hello there'),
    ]);

    const before = storedById();

    const renamedKappa = createSevenTvEmote({
      ...kappa,
      name: 'KappaPride',
      original_name: 'Kappa',
    });

    act(() => {
      updateSevenTvEmotes(channelId, [renamedKappa], [kappa]);
    });

    const after = storedById();

    expect({
      oldName: storedTokens('old-name'),
      newName: storedTokens('new-name'),
    }).toEqual<Record<string, TokenSummary[]>>({
      oldName: [{ type: 'text', content: 'Kappa' }],
      newName: [
        {
          type: 'emote',
          content: 'KappaPride',
          url: 'https://cdn.example.test/kappa.webp',
        },
      ],
    });

    expect(after.get('plain')).toBe(before.get('plain'));
  });

  test('re-resolves every row, processed or not, for a bulk update past the name limit', () => {
    jest.useFakeTimers();
    seedChannelCache({ sevenTvChannelEmotes: [kappa] });

    const processedMessageIds = new Set<string>();
    renderLiveReprocess(processedMessageIds);

    addMessages(
      Array.from({ length: 12 }, (_, index) =>
        createTextOnlyMessage(`row-${index}`, `NewHype row${index}`),
      ),
    );

    processedMessageIds.add('row-11');

    const bulk = [
      newHype,
      ...Array.from({ length: MAX_FILTERED_EMOTE_NAMES }, (_, index) =>
        createSevenTvEmote({ id: `bulk-${index}`, name: `Bulk${index}` }),
      ),
    ];

    const resolveSpy = jest.spyOn(
      resolveTokensModule,
      'resolveMessageEmoteTokens',
    );

    act(() => {
      updateSevenTvEmotes(channelId, bulk, []);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect({
      resolveCalls: resolveSpy.mock.calls.length,
      first: storedTokens('row-0')[0],
      processed: storedTokens('row-11')[0],
    }).toEqual<{
      resolveCalls: number;
      first: TokenSummary | undefined;
      processed: TokenSummary | undefined;
    }>({
      resolveCalls: 12,
      first: resolvedNewHype,
      processed: resolvedNewHype,
    });
  });
});

afterEach(flushChatStoreTimers);
