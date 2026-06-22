import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import { updateMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { act, renderHook } from '@testing-library/react-native';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import { createEmotePart } from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';
import type { AnyChatMessageType } from '@app/components/Chat/util/messageHandlers';
import {
  createEmoteData,
  createSevenTvEmote,
} from './__fixtures__/useChat.fixture';
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

jest.mock('@app/utils/chat/emoteProcessor', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest mock factory runs before module imports
  const {
    createEmotePart,
  } = require('@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture');
  return {
    processEmotesWorklet: jest.fn((x: { inputString: string }) => [
      createEmotePart(x.inputString, { id: 'e1', url: '' }),
    ]),
  };
});

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
    userstate: createUserStateTags({
      'display-name': 'user',
      login: 'user',
      username: 'user',
      'user-id': '1',
      id: messageId,
      color: '#fff',
    }),
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

describe('useEmoteReprocessing', () => {
  const channelId = 'channel-1';
  const processedMessageIdsRef = { current: new Set<string>() };

  const emoteDataWithEmotes = createEmoteData({
    sevenTvGlobalEmotes: [
      createSevenTvEmote({ id: 'e1', name: 'Kappa', url: '' }),
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmojisPeek.mockReturnValue([]);
    processedMessageIdsRef.current.clear();
  });

  test('does nothing when emoteLoadStatus is not success', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
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
    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('does nothing when getCurrentEmoteData returns null', () => {
    mockGetCurrentEmoteData.mockReturnValue(
      null as unknown as ReturnType<typeof getCurrentEmoteData>,
    );
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
    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('does nothing when emote data has no emotes', () => {
    mockGetCurrentEmoteData.mockReturnValue(
      createEmoteData({
        ...emoteDataWithEmotes,
        sevenTvGlobalEmotes: [],
        sevenTvChannelEmotes: [],
        twitchGlobalEmotes: [],
        twitchChannelEmotes: [],
        bttvGlobalEmotes: [],
        bttvChannelEmotes: [],
        ffzGlobalEmotes: [],
        ffzChannelEmotes: [],
      }),
    );
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

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('reprocesses text-only unprocessed messages and calls updateMessages', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
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
    const existingParts = [createEmotePart('Kappa', { id: 'e1', url: '' })];
    jest
      .requireMock('@app/utils/chat/emoteProcessor')
      .processEmotesWorklet.mockReturnValueOnce(existingParts);
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
    const msg1 = {
      ...createTextOnlyMessage('msg-1', 'nonce-1', 'Kappa'),
      message: existingParts,
    };
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

    expect(mockUpdateMessages).not.toHaveBeenCalled();
    expect(processedMessageIdsRef.current.has('msg-1')).toBe(true);
  });

  test('skips sparse or incomplete message entries', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
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

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('msg-1', 'nonce-1'),
    ]);
  });

  test('skips messages already in processedMessageIdsRef', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
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

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('skips system messages and usernotice', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
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

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('reprocesses existing emote parts when reprocessKey changes', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
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

    expect(mockUpdateMessages).not.toHaveBeenCalled();

    rerender({ reprocessKey: 'google' });

    expect(mockUpdateMessages).toHaveBeenCalledWith([
      expectMessageUpdate('1', 'n1'),
    ]);
  });

  test('skips messages with non-chat content parts', () => {
    mockGetCurrentEmoteData.mockReturnValue(emoteDataWithEmotes);
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

    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });
});
