import { createChatIrcHandlers } from '@app/components/chat/util/createChatIrcHandlers';
import { createRoomStateTracker } from '@app/components/chat/util/room-state/roomStateTracker';
import {
  cacheChannelPointRewardTitle,
  clearChannelPointRewardTitles,
  getCachedChannelPointRewardTitle,
} from '@app/store/chat/actions/channelPointRewardTitleStore';
import { clearMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';

function createHandlers() {
  const enqueueLiveChatMessage = jest.fn<
    void,
    [AnyChatMessageType, boolean | undefined]
  >();

  const handleNewMessage = jest.fn();

  const handlers = createChatIrcHandlers({
    channelId: 'room-1',
    channelName: 'somechannel',
    clearLocalMessages: jest.fn(),
    enqueueLiveChatMessage,
    handleNewMessage,
    listRef: { current: null },
    messages$: { peek: () => [] },
    moderateChatMessageById: jest.fn(),
    moderateChatMessagesByLogin: jest.fn(),
    processMessageEmotes: jest.fn(),
    removeChatMessageById: jest.fn(),
    removeChatMessagesByLogin: jest.fn(),
    roomStateTracker: createRoomStateTracker(),
  });

  return { enqueueLiveChatMessage, handleNewMessage, handlers };
}

describe('createChatIrcHandlers channel point ingest', () => {
  afterEach(() => {
    clearChannelPointRewardTitles();
  });

  test('a rewardgift with a body caches the reward title', () => {
    const { handlers, handleNewMessage } = createHandlers();

    const tags: UserNoticeTags = {
      'msg-id': 'rewardgift',
      id: 'notice-1',
      login: 'viewer',
      'custom-reward-id': 'reward-1',
      'msg-param-reward-title': 'Hydrate',
    };

    handlers.onUserNotice('#somechannel', tags, 'drink water');

    expect({
      cached: getCachedChannelPointRewardTitle('room-1', 'reward-1'),
      published: handleNewMessage.mock.calls.length,
    }).toEqual({ cached: 'Hydrate', published: 1 });
  });

  test('a PRIVMSG for a cached reward gets the reward title', () => {
    cacheChannelPointRewardTitle('room-1', 'reward-2', 'Chinese TTS');

    const { handlers, enqueueLiveChatMessage } = createHandlers();

    handlers.onMessage(
      '#somechannel',
      { id: 'msg-1', login: 'viewer', 'custom-reward-id': 'reward-2' },
      'ni hao',
    );

    const message = enqueueLiveChatMessage.mock.calls[0]?.[0];

    expect(message?.userstate['msg-param-custom-reward-title'] ?? null).toEqual(
      'Chinese TTS',
    );
  });
});

describe('createChatIrcHandlers notices', () => {
  afterEach(() => {
    clearMessages();
    flushChatStoreTimers();
  });

  const noticeContents = () =>
    chatStore$.messages
      .peek()
      .flatMap(message =>
        message.message.flatMap(part =>
          part.type === 'text' ? [part.content] : [],
        ),
      );

  test.each([
    'delete_message_success',
    'emote_only_off',
    'emote_only_on',
    'followers_off',
    'followers_on',
    'followers_on_zero',
    'r9k_off',
    'r9k_on',
    'slow_off',
    'slow_on',
    'subs_off',
    'subs_on',
  ])('a %s notice adds no system message', noticeId => {
    const { handlers } = createHandlers();

    handlers.onNotice('#somechannel', { 'msg-id': noticeId }, 'Room changed.');

    expect(noticeContents()).toEqual([]);
  });

  test('a notice that is not suppressed adds a system message', () => {
    const { handlers } = createHandlers();

    handlers.onNotice('#somechannel', { 'msg-id': 'msg_banned' }, 'Banned.');

    expect(noticeContents()).toEqual([
      'You are permanently banned from this channel.',
    ]);
  });
});
