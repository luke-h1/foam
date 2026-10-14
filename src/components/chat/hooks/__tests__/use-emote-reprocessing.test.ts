import { act, renderHook } from '@testing-library/react-native';

import {
  createSevenTvEmote,
  createTwitchEmote,
} from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat.fixture';
import { useEmoteReprocessing } from '@app/components/chat/hooks/use-emote-reprocessing';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { sevenTvService } from '@app/services/seven-tv-service';
import { addMessages, clearMessages } from '@app/store/chat/actions/messages';
import {
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  type AnyChatMessageType,
  type ChannelCacheType,
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { MessageToken } from '@app/utils/chat/message-token';

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
type MessageWithoutUserstate = Omit<AnyChatMessageType, 'userstate'> & {
  userstate: undefined;
};

/**
 * The store replaces token ids with part indexes, so an emote is identified
 * by the url that only the resolved emote carries.
 */
interface TokenSummary {
  type: string;
  content?: string;
  url?: string;
}

function createTextOnlyMessage(
  messageId: string,
  text: string,
  login = 'user',
): AnyChatMessageType {
  return {
    id: messageId,
    message_id: messageId,
    message_nonce: `nonce-${messageId}`,
    message: [{ type: 'text', content: text }],
    channel: 'test',
    sender: login,
    badges: [],
    userstate: createUserStateTags({
      'display-name': login,
      login,
      username: login,
      'user-id': '1',
      id: messageId,
      color: '#fff',
    }),
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
  };
}

function seedChannelCache(overrides: Partial<ChannelCacheType> = {}) {
  chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());

  chatStore$.persisted.channelCaches.set({
    [channelId]: { ...makeEmptyEmoteData(), ...overrides },
  });
}

/**
 * Reduces tokens to the fields these tests assert on, so the shape can be
 * compared with `toEqual` instead of a partial matcher.
 */
function summariseTokens(tokens: MessageToken[]): TokenSummary[] {
  return tokens.map(token => {
    if (token.type === 'emote') {
      return {
        type: token.type,
        content: token.content,
        url: token.url,
      };
    }

    return {
      type: token.type,
      content: 'content' in token ? token.content : undefined,
    };
  });
}

function storedTokens(messageId: string): TokenSummary[] {
  const message = chatStore$.messages
    .peek()
    .find(entry => entry.message_id === messageId);

  if (!message) {
    throw new Error(`Message ${messageId} is not in the store`);
  }

  return summariseTokens(message.message);
}

function enrichedMessageIds(): string[] {
  return chatStore$.messages
    .peek()
    .filter(message => message.message.some(token => token.type === 'emote'))
    .map(message => message.message_id);
}

const resolvedKappa: TokenSummary = {
  type: 'emote',
  content: 'Kappa',
  url: 'https://cdn.example.test/kappa.webp',
};

interface RenderReprocessOptions {
  emoteLoadStatus?: string;
  messages$?: { peek: () => AnyChatMessageType[] };
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

  test('yields between large reprocessing batches', () => {
    jest.useFakeTimers();

    try {
      seedChannelCache({ sevenTvChannelEmotes: [kappa] });

      const messages = Array.from({ length: 30 }, (_, index) =>
        createTextOnlyMessage(`msg-${index}`, 'hello Kappa'),
      );

      addMessages(messages);
      renderReprocess();

      const allIds = messages.map(message => message.message_id);

      // The first batch commits at once so emotes start to show.
      expect(enrichedMessageIds()).toEqual(allIds.slice(0, 6));

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Later batches accumulate instead of committing one store write each.
      expect(enrichedMessageIds()).toEqual(allIds.slice(0, 6));

      act(() => {
        jest.runAllTimers();
      });

      expect(enrichedMessageIds()).toEqual(allIds);
    } finally {
      jest.useRealTimers();
    }
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

    // The store never holds these shapes. The hook still has to tolerate
    // them, because it reads whatever `messages$` returns.
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
