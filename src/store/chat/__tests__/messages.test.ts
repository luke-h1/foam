import { internal } from '@legendapp/state';

import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import { createSubscriptionTags } from '@app/types/chat/irc-tags/__tests__/__fixtures__/user-notice-tags.fixture';
import type { MessageToken } from '@app/types/chat/messageToken';
import { createUserNoticeMessage } from '@app/utils/chat/message-handlers/createUserNoticeMessage';

import { getUserMessageColor } from '../actions/message-color-index';
import {
  addMessage,
  addMessages,
  clearMessages,
  getMaxChatMessages,
  getMessageById,
  moderateMessageById,
  moderateMessagesByLogin,
  RECENT_MESSAGES_SYNC_DELAY_MS,
  removeMessageById,
  restoreRecentMessagesForChannel,
  updateMessages,
} from '../actions/messages';
import { chatStore$ } from '../observables/chat-store';

function createInvalidStoredMessage(): AnyChatMessageType {
  return {
    ...createMessage('placeholder', 'placeholder', ''),
    message_id: '',
    message_nonce: '',
    message: [],
  };
}

function createSparsePersistedEntries(
  entries: (AnyChatMessageType | undefined)[],
): AnyChatMessageType[] {
  const sparseEntries = [...entries];
  // @ts-expect-error persisted replay can contain sparse historical entries
  return sparseEntries;
}

function createMessage(
  messageId: string,
  messageNonce: string,
  content: string,
): AnyChatMessageType {
  return createChatMessageFixture({
    id: `${messageId}_${messageNonce}`,
    message_id: messageId,
    message_nonce: messageNonce,
    sender: 'tester',
    message: [{ type: 'text', content }],
    userstate: createUserStateTags({
      username: 'tester',
      login: 'tester',
      'display-name': 'Tester',
      color: '#ff0000',
      'user-id': '1',
      id: messageId,
    }),
  });
}

describe('chatStore messages', () => {
  beforeEach(() => {
    clearMessages();
    chatStore$.currentChannelId.set(null);
    chatStore$.recentMessagesByChannel.set({});
  });

  afterEach(() => {
    jest.useRealTimers();
    clearMessages();
    chatStore$.currentChannelId.set(null);
    chatStore$.recentMessagesByChannel.set({});
  });

  test('keeps the newest messages when one flush is larger than the whole window', () => {
    const max = getMaxChatMessages();
    addMessage(createMessage('old', 'old-nonce', 'evicted'));

    addMessages(
      Array.from({ length: max + 5 }, (_unused, index) =>
        createMessage(
          `burst-${index}`,
          `burst-nonce-${index}`,
          `body ${index}`,
        ),
      ),
    );

    const messages = chatStore$.messages.peek();
    expect(messages).toHaveLength(max);

    expect(getMessageById('old')).toBeUndefined();

    // The front of the burst is dropped too, so the window ends on the newest.
    expect(getMessageById('burst-0')).toBeUndefined();

    expect(getMessageById(`burst-${max + 4}`)?.message_id).toBe(
      `burst-${max + 4}`,
    );
  });

  test('drops only the overflow when a flush partially overfills the window', () => {
    const max = getMaxChatMessages();

    addMessages(
      Array.from({ length: max }, (_unused, index) =>
        createMessage(`seed-${index}`, `seed-nonce-${index}`, `body ${index}`),
      ),
    );

    addMessages([createMessage('fresh', 'fresh-nonce', 'newest')]);

    const messages = chatStore$.messages.peek();
    expect(messages).toHaveLength(max);

    expect(getMessageById('seed-0')).toBeUndefined();

    expect(getMessageById('seed-1')?.message_id).toBe('seed-1');

    expect(getMessageById('fresh')?.message_id).toBe('fresh');
  });

  test('removeMessageById removes the targeted message and keeps others', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    addMessage(createMessage('msg-2', 'nonce-2', 'second'));

    removeMessageById('msg-1');

    expect(getMessageById('msg-1')).toBeUndefined();

    expect(getMessageById('msg-2')?.message_id).toBe('msg-2');

    expect(chatStore$.messages.peek()).toHaveLength(1);
  });

  test('addMessage publishes a new message array reference', () => {
    const before = chatStore$.messages.peek();

    addMessage(createMessage('msg-1', 'nonce-1', 'first'));

    expect(chatStore$.messages.peek()).not.toBe(before);

    expect(chatStore$.messages.peek()).toHaveLength(1);
  });

  test('updateMessage publishes a new message array reference', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    const before = chatStore$.messages.peek();

    updateMessages([
      {
        messageId: 'msg-1',
        messageNonce: 'nonce-1',
        updates: { message: [{ type: 'text', content: 'updated' }] },
      },
    ]);

    expect(chatStore$.messages.peek()).not.toBe(before);

    expect(getMessageById('msg-1')?.message).toEqual<MessageToken[]>([
      { type: 'text', content: 'updated' },
    ]);
  });

  test('addMessages ignores duplicate message keys from historical replay', () => {
    addMessages([
      createMessage('msg-1', 'msg-1', 'historical'),
      createMessage('msg-1', 'msg-1', 'live'),
    ]);

    expect(chatStore$.messages.peek()).toHaveLength(1);

    expect(getMessageById('msg-1')?.message).toEqual<MessageToken[]>([
      { type: 'text', content: 'historical' },
    ]);
  });

  test('moderateMessageById replaces message content with a moderation notice', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'peepoHappy'));

    moderateMessageById('msg-1', 'Deleted');

    expect(getMessageById('msg-1')?.message).toEqual<MessageToken[]>([
      { type: 'text', content: 'peepoHappy—Deleted' },
    ]);

    expect(getMessageById('msg-1')?.moderationNotice).toBe('Deleted');
  });

  test('moderateMessagesByLogin replaces all messages for the targeted login', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));

    addMessage({
      ...createMessage('msg-2', 'nonce-2', 'second'),
      userstate: {
        ...createMessage('msg-2', 'nonce-2', 'second').userstate,
        login: 'other-user',
        username: 'OtherUser',
      },
      sender: 'OtherUser',
    });

    moderateMessagesByLogin('tester', 'Timed out (1s)');

    expect(getMessageById('msg-1')?.message).toEqual<MessageToken[]>([
      { type: 'text', content: 'first—Timed out (1s)' },
    ]);

    expect(getMessageById('msg-2')?.message).toEqual<MessageToken[]>([
      { type: 'text', content: 'second' },
    ]);
  });

  test('restoreRecentMessagesForChannel restores cached recent messages for a channel', () => {
    chatStore$.currentChannelId.set('channel-1');
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    addMessage(createMessage('msg-2', 'nonce-2', 'second'));

    clearMessages();

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(2);

    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['msg-1', 'msg-2']);
  });

  test('restoreRecentMessagesForChannel marks restored messages as historical', () => {
    chatStore$.recentMessagesByChannel.set({
      'channel-1': [
        createMessage('msg-1', 'nonce-1', 'persisted without committedAt'),
        {
          ...createMessage('msg-2', 'nonce-2', 'persisted live'),
          committedAt: 123,
        },
      ],
    });

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(2);

    expect(
      chatStore$.messages.peek().map(message => ({
        id: message.message_id,
        isHistorical: message.isHistorical,
      })),
    ).toEqual([
      { id: 'msg-1', isHistorical: true },
      { id: 'msg-2', isHistorical: true },
    ]);
  });

  test('clearMessages clears sender color indexes', () => {
    addMessage(createMessage('msg-1', 'nonce-1', 'first'));

    expect(getUserMessageColor('tester')).toBe('#ff0000');

    clearMessages();

    expect(getUserMessageColor('tester')).toBeUndefined();
  });

  test('restoreRecentMessagesForChannel skips sparse persisted entries', () => {
    chatStore$.recentMessagesByChannel.set({
      'channel-1': createSparsePersistedEntries([
        undefined,
        createInvalidStoredMessage(),
        createMessage('msg-1', 'nonce-1', 'first'),
      ]),
    });

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(1);

    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['msg-1']);
  });

  test('restoreRecentMessagesForChannel dedupes persisted entries by id', () => {
    chatStore$.recentMessagesByChannel.set({
      'channel-1': [
        createMessage('msg-1', 'msg-1', 'first'),
        createMessage('msg-1', 'msg-1', 'duplicate key'),
        {
          ...createMessage('msg-2', 'msg-2', 'duplicate id'),
          id: 'msg-1_msg-1',
        },
        createMessage('msg-3', 'msg-3', 'third'),
      ],
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(2);

    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['msg-1', 'msg-3']);

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  test('normalises stored message id to the chat message key', () => {
    addMessage({
      ...createMessage('msg-1', 'nonce-1', 'first'),
      id: 'duplicate-id-from-source',
    });

    expect(chatStore$.messages.peek()[0]?.id).toBe('msg-1_nonce-1');
  });

  test('addMessages defers recent-message persistence off the live chat path', () => {
    jest.useFakeTimers();
    chatStore$.currentChannelId.set('channel-1');

    addMessages([
      createMessage('msg-1', 'nonce-1', 'first'),
      createMessage('msg-2', 'nonce-2', 'second'),
    ]);

    expect(chatStore$.messages.peek()).toHaveLength(2);

    expect(
      chatStore$.recentMessagesByChannel.peek()['channel-1'],
    ).toBeUndefined();

    jest.advanceTimersByTime(RECENT_MESSAGES_SYNC_DELAY_MS);

    const recentByChannel = chatStore$.recentMessagesByChannel.peek();
    expect(
      recentByChannel['channel-1']?.map(message => message.message_id),
    ).toEqual(['msg-1', 'msg-2']);

    jest.useRealTimers();
  });

  test('restoreRecentMessagesForChannel writes a deferred sync before it reads the window', () => {
    jest.useFakeTimers();
    chatStore$.currentChannelId.set('channel-1');

    addMessages([
      createMessage('msg-1', 'nonce-1', 'first'),
      createMessage('msg-2', 'nonce-2', 'second'),
    ]);

    const restoredCount = restoreRecentMessagesForChannel('channel-1');

    expect(restoredCount).toBe(2);

    expect(jest.getTimerCount()).toBe(0);
  });

  test('updateMessage defers recent-message persistence off the hydration path', () => {
    jest.useFakeTimers();

    addMessage(createMessage('msg-1', 'nonce-1', 'first'));
    chatStore$.currentChannelId.set('channel-1');

    updateMessages([
      {
        messageId: 'msg-1',
        messageNonce: 'nonce-1',
        updates: {
          message: [{ type: 'text', content: 'hydrated' }],
        },
      },
    ]);

    expect(getMessageById('msg-1')?.message).toEqual<MessageToken[]>([
      { type: 'text', content: 'hydrated' },
    ]);

    expect(
      chatStore$.recentMessagesByChannel.peek()['channel-1'],
    ).toBeUndefined();

    jest.advanceTimersByTime(RECENT_MESSAGES_SYNC_DELAY_MS);

    expect(
      chatStore$.recentMessagesByChannel.peek()['channel-1']?.[0]?.message,
    ).toEqual<MessageToken[]>([{ type: 'text', content: 'hydrated' }]);

    jest.useRealTimers();
  });

  test('addMessages skips sparse or incomplete entries', () => {
    addMessages([
      undefined,
      createInvalidStoredMessage(),
      createMessage('msg-1', 'nonce-1', 'first'),
    ]);

    expect(chatStore$.messages.peek()).toHaveLength(1);

    expect(chatStore$.messages.peek()[0]?.message_id).toBe('msg-1');
  });

  test('updating a message with mixed emote and text parts does not warn', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const message = createMessage('msg-1', 'nonce-1', 'first');

    addMessage({
      ...message,
      message: [
        {
          type: 'emote',
          content: 'WW',
          id: '01F71VQYHR000D3ZZ6Q11NR7TV',
          name: 'WW',
          url: 'https://cdn.7tv.app/emote/01F71VQYHR000D3ZZ6Q11NR7TV/4x.avif',
        },
        { type: 'text', content: ' ' },
        { type: 'text', content: 'HillaryClintonsEmails_' },
      ],
    });

    updateMessages([
      {
        messageId: 'msg-1',
        messageNonce: 'nonce-1',
        updates: { message: [{ type: 'text', content: 'updated' }] },
      },
    ]);

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  test('addMessages marks rows from a burst flush and leaves others unmarked', () => {
    addMessages([createMessage('calm', 'calm-nonce', 'calm')]);

    addMessages([createMessage('raid', 'raid-nonce', 'raid')], {
      arrivedInBurst: true,
    });

    expect(
      chatStore$.messages.peek().map(message => message.arrivedInBurst),
    ).toEqual([undefined, true]);
  });

  test('stores the parsed part array as given, so a cached parse stays shared', () => {
    const parts: MessageToken[] = [
      { type: 'emote', content: 'WW', id: '01F71VQYHR000D3ZZ6Q11NR7TV' },
      { type: 'text', content: ' ' },
      { type: 'emote', content: 'WW', id: '01F71VQYHR000D3ZZ6Q11NR7TV' },
    ];

    addMessage({ ...createMessage('msg-1', 'nonce-1', ''), message: parts });
    addMessage({ ...createMessage('msg-2', 'nonce-2', ''), message: parts });

    const [first, second] = chatStore$.messages.peek();

    expect(first?.message).toBe(parts);

    expect(second?.message).toBe(parts);

    expect(parts).toEqual<MessageToken[]>([
      { type: 'emote', content: 'WW', id: '01F71VQYHR000D3ZZ6Q11NR7TV' },
      { type: 'text', content: ' ' },
      { type: 'emote', content: 'WW', id: '01F71VQYHR000D3ZZ6Q11NR7TV' },
    ]);
  });

  // Part ids only matter to Legend State when a node exists below a message:
  // its array diff keys child nodes by `id`, and a message can hold one emote
  // twice. Store writes must never create those nodes.
  test('store writes create no observable nodes below the message window', () => {
    const cap = getMaxChatMessages();

    addMessages(
      Array.from({ length: cap }, (_, index) =>
        createMessage(`msg-${index}`, `nonce-${index}`, `${index}`),
      ),
    );

    addMessages(
      Array.from({ length: 10 }, (_, index) =>
        createMessage(`msg-${cap + index}`, `nonce-${cap + index}`, 'late'),
      ),
    );

    updateMessages([
      {
        messageId: `msg-${cap}`,
        messageNonce: `nonce-${cap}`,
        updates: { message: [{ type: 'text', content: 'updated' }] },
      },
    ]);

    moderateMessageById(`msg-${cap + 1}`, 'Deleted');

    expect(internal.getNode(chatStore$.messages).children?.size ?? 0).toBe(0);
  });

  test('surviving messages stay addressable after later flushes trim the window', () => {
    const cap = getMaxChatMessages();

    addMessages(
      Array.from({ length: cap }, (_, index) =>
        createMessage(`msg-${index}`, `nonce-${index}`, `${index}`),
      ),
    );

    // A follow-up flush on a full window front-trims the survivors, whose
    // indexes were recorded before the trim and must shift with it.
    addMessages(
      Array.from({ length: 10 }, (_, index) =>
        createMessage(`msg-${cap + index}`, `nonce-${cap + index}`, 'late'),
      ),
    );

    const messages = chatStore$.messages.peek();
    expect(messages).toHaveLength(cap);

    expect(messages[0]?.message_id).toBe('msg-10');

    expect(getMessageById('msg-9')).toBeUndefined();

    const survivor = cap - 50;

    expect(getMessageById(`msg-${survivor}`)?.message).toEqual<MessageToken[]>([
      { type: 'text', content: `${survivor}` },
    ]);

    moderateMessageById(`msg-${survivor}`, 'Timed out (10s)');

    expect(getMessageById(`msg-${survivor}`)?.moderationNotice).toBe(
      'Timed out (10s)',
    );

    expect(getMessageById(`msg-${survivor}`)?.message).toEqual<MessageToken[]>([
      { type: 'text', content: `${survivor}—Timed out (10s)` },
    ]);

    expect(
      getMessageById(`msg-${survivor - 1}`)?.moderationNotice,
    ).toBeUndefined();

    expect(
      getMessageById(`msg-${survivor + 1}`)?.moderationNotice,
    ).toBeUndefined();
  });

  test('stores one row when a USERNOTICE arrives live and again via replay', () => {
    const tags = createSubscriptionTags({ id: 'sub-notice-id' });

    addMessage(
      createUserNoticeMessage({
        timestampFormat: '24h',
        tags,
        channelName: 'c',
        text: '',
      }),
    );
    addMessage(
      createUserNoticeMessage({
        timestampFormat: '24h',
        tags,
        channelName: 'c',
        text: '',
      }),
    );

    expect(
      chatStore$.messages.peek().map(message => message.message_id),
    ).toEqual(['sub-notice-id']);
  });
});
