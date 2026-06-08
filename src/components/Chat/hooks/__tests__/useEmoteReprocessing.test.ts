import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import {
  emptyEmoteData,
  type SanitisedEmote,
} from '@app/store/chat/types/constants';
import { updateMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { observable } from '@legendapp/state';
import { act, renderHook } from '@testing-library/react-native';
import type { AnyChatMessageType } from '../../util/messageHandlers';
import { useEmoteReprocessing } from '../useEmoteReprocessing';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
}));
jest.mock('@app/store/chat/actions/messages', () => ({
  updateMessages: jest.fn(),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    emojis: {
      peek: jest.fn(() => []),
    },
  },
}));

jest.mock('@app/utils/chat/emoteProcessor', () => ({
  processEmotesWorklet: jest.fn((x: { inputString: string }) => [
    { type: 'emote' as const, content: x.inputString, id: 'e1', url: '' },
  ]),
}));

jest.mock('@app/utils/chat/findBadges', () => ({
  findBadges: jest.fn(() => []),
}));

const mockGetCurrentEmoteData = jest.mocked(getCurrentEmoteData);
const mockUpdateMessages = jest.mocked(updateMessages);
const mockEmojisPeek = jest.mocked(chatStore$.emojis.peek);

function createTextOnlyMessage(
  messageId: string,
  nonce: string,
  text: string,
): AnyChatMessageType {
  return {
    id: messageId,
    message_id: messageId,
    message_nonce: nonce,
    message: [{ type: 'text', content: text }],
    channel: 'test',
    sender: 'user',
    badges: [],
    userstate: {
      'display-name': 'user',
      login: 'user',
      username: 'user',
      'user-id': '1',
      id: messageId,
      color: '#fff',
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    },
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
  };
}

const expectMessageUpdate = (id: string, nonce: string) => ({
  messageId: id,
  messageNonce: nonce,
  updates: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    message: expect.any(Array),
    badges: [],
  },
});

function createMessagesObservable(
  messages: AnyChatMessageType[],
): typeof chatStore$.messages {
  return observable({ messages }).messages;
}

describe('useEmoteReprocessing', () => {
  const channelId = 'channel-1';
  const processedMessageIdsRef = { current: new Set<string>() };

  const twitchGlobalEmote = {
    creator: null,
    emote_link: '',
    id: 'e1',
    name: 'Kappa',
    original_name: 'Kappa',
    site: 'Twitch Global',
    url: '',
  } satisfies SanitisedEmote;

  const emoteDataWithEmotes = {
    sevenTvGlobalEmotes: [],
    sevenTvChannelEmotes: [],
    twitchGlobalEmotes: [twitchGlobalEmote],
    twitchChannelEmotes: [],
    twitchSubscriberEmotes: [],
    bttvGlobalEmotes: [],
    bttvChannelEmotes: [],
    ffzGlobalEmotes: [],
    ffzChannelEmotes: [],
    chatterinoBadges: [],
    ffzChannelBadges: [],
    ffzGlobalBadges: [],
    twitchChannelBadges: [],
    twitchGlobalBadges: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmojisPeek.mockReturnValue([]);
    processedMessageIdsRef.current.clear();
  });

  test('does nothing when emoteLoadStatus is not success', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const messages$ = createMessagesObservable([
      createTextOnlyMessage('1', 'n1', 'hello'),
    ]);
    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'loading',
        processedMessageIdsRef,
      }),
    );

    expect(mockGetCurrentEmoteData).not.toHaveBeenCalled();
    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('does nothing when emote data has no emotes', () => {
    mockGetCurrentEmoteData.mockReturnValue({
      ...emoteDataWithEmotes,
      sevenTvGlobalEmotes: [],
      sevenTvChannelEmotes: [],
      twitchGlobalEmotes: [],
      twitchChannelEmotes: [],
      twitchSubscriberEmotes: [],
      bttvGlobalEmotes: [],
      bttvChannelEmotes: [],
      ffzGlobalEmotes: [],
      ffzChannelEmotes: [],
    });
    const messages$ = createMessagesObservable([
      createTextOnlyMessage('1', 'n1', 'hello'),
    ]);
    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('reprocesses text-only unprocessed messages and calls updateMessages', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const msg1 = createTextOnlyMessage('msg-1', 'nonce-1', 'hello world');
    const messages$ = createMessagesObservable([msg1]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockGetCurrentEmoteData).toHaveBeenCalledWith(channelId);
    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('msg-1', 'nonce-1'),
    ]);
    expect(processedMessageIdsRef.current.has('msg-1')).toBe(true);
  });

  test('yields between large reprocessing batches', () => {
    jest.useFakeTimers();
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const messages = Array.from({ length: 30 }, (_, index) =>
      createTextOnlyMessage(`msg-${index}`, `nonce-${index}`, 'hello world'),
    );
    const messages$ = createMessagesObservable(messages);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessages.mock.calls[0]?.[0]).toHaveLength(6);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockUpdateMessages).toHaveBeenCalledTimes(2);
    expect(mockUpdateMessages.mock.calls[1]?.[0]).toHaveLength(6);
    jest.useRealTimers();
  });

  test('skips equivalent reprocessed message parts and badges', () => {
    const existingParts = [
      { type: 'emote' as const, content: 'Kappa', id: 'e1', url: '' },
    ];
    jest
      .requireMock('@app/utils/chat/emoteProcessor')
      .processEmotesWorklet.mockReturnValueOnce(existingParts);
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const msg1 = {
      ...createTextOnlyMessage('msg-1', 'nonce-1', 'Kappa'),
      message: existingParts,
    };
    const messages$ = createMessagesObservable([msg1]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessages).not.toHaveBeenCalled();
    expect(processedMessageIdsRef.current.has('msg-1')).toBe(true);
  });

  test('skips sparse message entries', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const validMessage = createTextOnlyMessage('msg-1', 'nonce-1', 'hello');
    const messages = Array<AnyChatMessageType>(4);
    messages[3] = validMessage;
    const messages$ = createMessagesObservable(messages);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('msg-1', 'nonce-1'),
    ]);
  });

  test('skips messages already in processedMessageIdsRef', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    processedMessageIdsRef.current.add('msg-1');
    const msg1 = createTextOnlyMessage('msg-1', 'nonce-1', 'hello');
    const messages$ = createMessagesObservable([msg1]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('skips system messages', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const systemMsg = {
      ...createTextOnlyMessage('sys-1', 'n1', 'hi'),
      sender: 'System',
    };
    const messages$ = createMessagesObservable([systemMsg]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('reprocesses existing emote parts when reprocessKey changes', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    processedMessageIdsRef.current.add('1');
    const message = [
      { type: 'text', content: 'hi ' },
      {
        type: 'emote',
        content: 'Kappa',
        original_name: 'Kappa',
        id: 'e1',
        url: '',
      },
    ] satisfies AnyChatMessageType['message'];

    const withEmote = {
      ...createTextOnlyMessage('1', 'n1', 'hello'),
      message,
    };
    const messages$ = createMessagesObservable([withEmote]);

    const { rerender } = renderHook(
      ({ reprocessKey }: { reprocessKey: string }) =>
        useEmoteReprocessing({
          channelId,
          channelEmoteData: emptyEmoteData,
          messages$,
          emoteLoadStatus: 'success',
          processedMessageIdsRef,
          reprocessKey,
        }),
      {
        initialProps: {
          reprocessKey: 'twitter',
        },
      },
    );

    expect(mockUpdateMessages).not.toHaveBeenCalled();

    rerender({ reprocessKey: 'google' });

    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('1', 'n1'),
    ]);
  });

  test('skips messages with non-chat content parts', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const message = [
      { type: 'twitchClip', content: 'https://example.com' },
    ] satisfies AnyChatMessageType['message'];
    const withMedia = {
      ...createTextOnlyMessage('1', 'n1', 'hello'),
      message,
    };
    const messages$ = createMessagesObservable([withMedia]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emptyEmoteData,
        messages$,
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });
});
