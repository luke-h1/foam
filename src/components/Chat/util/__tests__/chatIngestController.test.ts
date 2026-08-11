import { clearMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { parseIrcMessage } from '@app/utils/chat/ircProtocol/parseIrcMessage';
import { routeIrcMessage } from '@app/utils/chat/ircProtocol/routeIrcMessage';

import {
  type ChatIngestController,
  createChatIngestController,
} from '../chatIngestController';
import { createChatIrcHandlers } from '../createChatIrcHandlers';
import type { BufferedMessage } from '../messageBuffer';
import { createRoomStateTracker } from '../roomState/roomStateTracker';

jest.mock('@legendapp/state/persist', () => ({
  configureObservablePersistence: jest.fn(),
  persistObservable: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: class MockMMKV {
    set = jest.fn();
    getString = jest.fn();
    getAllKeys = jest.fn(() => []);
    delete = jest.fn();
  },
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getAllKeys: jest.fn(() => []),
    remove: jest.fn(),
  }),
}));

function stripPendingParse(message: BufferedMessage): BufferedMessage {
  if (!message.pendingEmoteParse) {
    return message;
  }
  const { pendingEmoteParse: _pending, ...rest } = message;
  return rest;
}

/**
 * The full headless ingest path: a raw IRC line through the parser, the
 * shared command demux, the handlers factory and the ingest controller into
 * the real chatStore$ - no socket, no React, fake timers.
 */
function createHeadlessIngest(options?: {
  isAtBottom?: () => boolean;
  getChatDelayMs?: () => number;
  onUnreadIncrement?: (count: number) => void;
}) {
  const controller: ChatIngestController = createChatIngestController({
    getFinalizeMessageForCommit: () => stripPendingParse,
    getChatDelayMs: options?.getChatDelayMs ?? (() => 0),
    isAtBottom: options?.isAtBottom ?? (() => true),
    isScrollingToBottom: () => false,
    isUserActivelyScrolling: () => false,
    onBottomContentChange: () => {},
    onUnreadIncrement: options?.onUnreadIncrement ?? (() => {}),
  });

  const handlers = createChatIrcHandlers({
    channelId: '123',
    channelName: 'somechannel',
    clearLocalMessages: controller.clearLocalMessages,
    enqueueLiveChatMessage: (baseMessage, countUnread) => {
      controller.handleNewMessage(
        { ...baseMessage, pendingEmoteParse: true },
        { countUnread },
      );
    },
    handleNewMessage: (message, messageOptions) => {
      controller.handleNewMessage(message, messageOptions);
    },
    listRef: { current: null },
    messages$: chatStore$.messages,
    moderateChatMessageById: controller.moderateChatMessageById,
    moderateChatMessagesByLogin: controller.moderateChatMessagesByLogin,
    processMessageEmotes: (
      _text,
      _userstate,
      baseMessage,
      _userId,
      countUnread,
    ) => {
      controller.handleNewMessage(baseMessage, { countUnread });
    },
    removeChatMessageById: controller.removeChatMessageById,
    removeChatMessagesByLogin: controller.removeChatMessagesByLogin,
    roomStateTracker: createRoomStateTracker(),
  });

  const routeLine = (line: string) => {
    const message = parseIrcMessage(line);
    expect(message).not.toBeNull();
    routeIrcMessage(message!, {
      privmsg: handlers.onMessage,
      clearchat: handlers.onClearChat,
      clearmsg: handlers.onClearMessage,
      roomstate: handlers.onRoomState,
    });
  };

  return { controller, handlers, routeLine };
}

const PRIVMSG_LINE =
  '@badge-info=;badges=;color=#FF0000;display-name=Chatter;emotes=;id=msg-1;mod=0;room-id=123;tmi-sent-ts=1000;user-id=42;user-type= :chatter!chatter@chatter.tmi.twitch.tv PRIVMSG #somechannel :hello world';

describe('chatIngestController (headless line → commit)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearMessages();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function committedMessages(): AnyChatMessageType[] {
    return chatStore$.messages.peek();
  }

  test('commits a raw privmsg line into the real store', () => {
    const { routeLine } = createHeadlessIngest();

    routeLine(PRIVMSG_LINE);
    jest.advanceTimersByTime(2_000);

    const committed = committedMessages();
    expect(committed).toHaveLength(1);
    const message = committed[0]!;
    expect(message.message_id).toBe('msg-1');
    expect(message.userstate.login).toBe('chatter');
    expect(message.pendingEmoteParse).toBeUndefined();
    expect(
      message.message.some(
        part => part.type === 'text' && part.content.includes('hello world'),
      ),
    ).toBe(true);
  });

  test('counts unread instead of committing silently while scrolled up', () => {
    const onUnreadIncrement = jest.fn();
    const { routeLine } = createHeadlessIngest({
      isAtBottom: () => false,
      onUnreadIncrement,
    });

    routeLine(PRIVMSG_LINE);
    jest.advanceTimersByTime(5_000);

    expect(committedMessages()).toHaveLength(1);
    expect(onUnreadIncrement).toHaveBeenCalledWith(1);
  });

  test('holds a live line in the delay queue for the configured delay', () => {
    const { routeLine } = createHeadlessIngest({
      getChatDelayMs: () => 5_000,
    });

    routeLine(PRIVMSG_LINE);
    jest.advanceTimersByTime(2_000);
    expect(committedMessages()).toHaveLength(0);

    jest.advanceTimersByTime(6_000);
    expect(committedMessages()).toHaveLength(1);
  });

  test('a targeted clearchat line moderates the committed message', () => {
    const { routeLine } = createHeadlessIngest();

    routeLine(PRIVMSG_LINE);
    jest.advanceTimersByTime(2_000);
    expect(committedMessages()).toHaveLength(1);

    routeLine(
      '@room-id=123;target-user-id=42;tmi-sent-ts=2000 CLEARCHAT #somechannel :chatter',
    );
    jest.advanceTimersByTime(2_000);

    const moderated = committedMessages().find(
      message => message.message_id === 'msg-1',
    );
    expect(moderated?.moderationNotice).toBe('Permanently banned');
    expect(
      committedMessages().some(message =>
        message.message.some(
          part =>
            part.type === 'text' &&
            part.content.includes('chatter has been permanently banned'),
        ),
      ),
    ).toBe(true);
  });
});
