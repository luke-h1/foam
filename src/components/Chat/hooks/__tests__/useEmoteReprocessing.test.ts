import { getCurrentEmoteData } from '@app/store/chatStore/channelLoad';
import { updateMessage } from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { act, renderHook } from '@testing-library/react-native';
import type { AnyChatMessageType } from '../../util/messageHandlers';
import { useEmoteReprocessing } from '../useEmoteReprocessing';

jest.mock('@app/store/chatStore/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
}));
jest.mock('@app/store/chatStore/messages', () => ({
  updateMessage: jest.fn(),
}));

jest.mock('@app/store/chatStore/state', () => ({
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

const mockGetCurrentEmoteData = getCurrentEmoteData as jest.MockedFunction<
  typeof getCurrentEmoteData
>;
const mockUpdateMessage = updateMessage as jest.MockedFunction<
  typeof updateMessage
>;
const mockChatStore = chatStore$ as unknown as {
  emojis: {
    peek: jest.MockedFunction<() => unknown[]>;
  };
};

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
  } as AnyChatMessageType;
}

describe('useEmoteReprocessing', () => {
  const channelId = 'channel-1';
  const processedMessageIdsRef = { current: new Set<string>() };

  const emoteDataWithEmotes = {
    sevenTvGlobalEmotes: [{ id: 'e1', name: 'Kappa', url: '' }],
    sevenTvChannelEmotes: [],
    twitchGlobalEmotes: [],
    twitchChannelEmotes: [],
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
    mockChatStore.emojis.peek.mockReturnValue([]);
    processedMessageIdsRef.current.clear();
  });

  test('does nothing when emoteLoadStatus is not success', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    const peek = jest
      .fn()
      .mockReturnValue([createTextOnlyMessage('1', 'n1', 'hello')]);
    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: {},
        messages$: { peek },
        emoteLoadStatus: 'loading',
        processedMessageIdsRef,
      }),
    );

    expect(mockGetCurrentEmoteData).not.toHaveBeenCalled();
    expect(mockUpdateMessage).not.toHaveBeenCalled();
  });

  test('does nothing when getCurrentEmoteData returns null', () => {
    mockGetCurrentEmoteData.mockReturnValue(null as never);
    const peek = jest
      .fn()
      .mockReturnValue([createTextOnlyMessage('1', 'n1', 'hello')]);
    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: {},
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockGetCurrentEmoteData).toHaveBeenCalledWith(channelId);
    expect(mockUpdateMessage).not.toHaveBeenCalled();
  });

  test('does nothing when emote data has no emotes', () => {
    mockGetCurrentEmoteData.mockReturnValue({
      ...emoteDataWithEmotes,
      sevenTvGlobalEmotes: [],
      sevenTvChannelEmotes: [],
      twitchGlobalEmotes: [],
      twitchChannelEmotes: [],
      bttvGlobalEmotes: [],
      bttvChannelEmotes: [],
      ffzGlobalEmotes: [],
      ffzChannelEmotes: [],
    } as never);
    const peek = jest
      .fn()
      .mockReturnValue([createTextOnlyMessage('1', 'n1', 'hello')]);
    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: {},
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessage).not.toHaveBeenCalled();
  });

  test('reprocesses text-only unprocessed messages and calls updateMessage', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    const msg1 = createTextOnlyMessage('msg-1', 'nonce-1', 'hello world');
    const peek = jest.fn().mockReturnValue([msg1]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emoteDataWithEmotes,
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockGetCurrentEmoteData).toHaveBeenCalledWith(channelId);
    expect(mockUpdateMessage).toHaveBeenCalledWith('msg-1', 'nonce-1', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: expect.any(Array),
      badges: [],
    });
    expect(processedMessageIdsRef.current.has('msg-1')).toBe(true);
  });

  test('yields between large reprocessing batches', () => {
    jest.useFakeTimers();
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    const messages = Array.from({ length: 30 }, (_, index) =>
      createTextOnlyMessage(`msg-${index}`, `nonce-${index}`, 'hello world'),
    );
    const peek = jest.fn().mockReturnValue(messages);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emoteDataWithEmotes,
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessage).toHaveBeenCalledTimes(24);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockUpdateMessage).toHaveBeenCalledTimes(30);
    jest.useRealTimers();
  });

  test('skips sparse or incomplete message entries', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    const validMessage = createTextOnlyMessage('msg-1', 'nonce-1', 'hello');
    const peek = jest
      .fn()
      .mockReturnValue([
        undefined,
        { message_id: '', message: [] },
        { message_id: 'bad', message: undefined },
        validMessage,
      ]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: emoteDataWithEmotes,
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessage).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessage).toHaveBeenCalledWith('msg-1', 'nonce-1', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: expect.any(Array),
      badges: [],
    });
  });

  test('skips messages already in processedMessageIdsRef', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    processedMessageIdsRef.current.add('msg-1');
    const msg1 = createTextOnlyMessage('msg-1', 'nonce-1', 'hello');
    const peek = jest.fn().mockReturnValue([msg1]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: {},
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessage).not.toHaveBeenCalled();
  });

  test('skips system messages and usernotice', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    const systemMsg = {
      ...createTextOnlyMessage('sys-1', 'n1', 'hi'),
      sender: 'System',
    };
    const noticeMsg = {
      ...createTextOnlyMessage('notice-1', 'n2', 'hi'),
      notice_tags: {},
    };
    const peek = jest.fn().mockReturnValue([systemMsg, noticeMsg]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: {},
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessage).not.toHaveBeenCalled();
  });

  test('reprocesses existing emote parts when reprocessKey changes', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    processedMessageIdsRef.current.add('1');
    const withEmote = {
      ...createTextOnlyMessage('1', 'n1', 'hello'),
      message: [
        { type: 'text', content: 'hi ' },
        {
          type: 'emote',
          content: 'Kappa',
          original_name: 'Kappa',
          id: 'e1',
          url: '',
        },
      ],
    };
    const peek = jest.fn().mockReturnValue([withEmote]);

    const { rerender } = renderHook(
      ({ reprocessKey }: { reprocessKey: string }) =>
        useEmoteReprocessing({
          channelId,
          channelEmoteData: {},
          messages$: { peek },
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

    expect(mockUpdateMessage).not.toHaveBeenCalled();

    rerender({ reprocessKey: 'google' });

    expect(mockUpdateMessage).toHaveBeenCalledWith('1', 'n1', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: expect.any(Array),
      badges: [],
    });
  });

  test('skips messages with non-chat content parts', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes as never);
    const withMedia = {
      ...createTextOnlyMessage('1', 'n1', 'hello'),
      message: [{ type: 'twitchClip', content: 'https://example.com' }],
    };
    const peek = jest.fn().mockReturnValue([withMedia]);

    renderHook(() =>
      useEmoteReprocessing({
        channelId,
        channelEmoteData: {},
        messages$: { peek },
        emoteLoadStatus: 'success',
        processedMessageIdsRef,
      }),
    );

    expect(mockUpdateMessage).not.toHaveBeenCalled();
  });
});
