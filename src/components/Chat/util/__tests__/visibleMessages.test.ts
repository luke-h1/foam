import type { ChatMessageType } from '@app/store/chatStore/constants';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  getPausedPendingMessageCount,
  getVisibleMessages,
} from '../visibleMessages';

type TestMessage = ChatMessageType<'usernotice'>;

function createMessage(
  id: string,
  sender: string,
  message: ParsedPart[],
  userstateOverrides: Partial<UserStateTags> = {},
): TestMessage {
  return {
    id,
    message_id: id,
    message_nonce: `${id}-nonce`,
    sender,
    channel: 'test',
    badges: [],
    message,
    replyBody: '',
    replyDisplayName: '',
    userstate: {
      username: sender,
      login: sender.toLowerCase(),
      color: '#ff00ff',
      'display-name': sender,
      'user-id': `${id}-user`,
      ...userstateOverrides,
    } as UserStateTags,
  };
}

describe('getVisibleMessages', () => {
  test('filters hidden users by sender and login', () => {
    const messages = [
      createMessage('one', 'alpha', [{ type: 'text', content: 'hello' }]),
      createMessage('two', 'beta', [{ type: 'text', content: 'hidden' }]),
    ];

    const visible = getVisibleMessages(messages, {
      hiddenUsers: ['beta'],
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.sender).toBe('alpha');
  });

  test('filters by search query across sender and message text', () => {
    const messages = [
      createMessage('one', 'alpha', [{ type: 'text', content: 'hello world' }]),
      createMessage('two', 'beta', [{ type: 'text', content: 'another row' }]),
    ];

    expect(
      getVisibleMessages(messages, {
        searchQuery: 'world',
      }),
    ).toEqual([messages[0]]);

    expect(
      getVisibleMessages(messages, {
        searchQuery: 'beta',
      }),
    ).toEqual([messages[1]]);
  });

  test('shows only messages that mention the current user in mention-only mode', () => {
    const messages = [
      createMessage('one', 'alpha', [
        { type: 'mention', content: '@luke' },
        { type: 'text', content: ' hi there' },
      ]),
      createMessage('two', 'beta', [
        { type: 'text', content: 'not a mention' },
      ]),
    ];

    const visible = getVisibleMessages(messages, {
      currentUsername: 'luke',
      showOnlyMentions: true,
    });

    expect(visible).toEqual([messages[0]]);
  });

  test('freezes the visible window at the pause anchor but still includes own messages after it', () => {
    const messages = [
      createMessage('one', 'alpha', [{ type: 'text', content: 'before' }]),
      createMessage('two', 'beta', [{ type: 'text', content: 'anchor' }]),
      createMessage('three', 'gamma', [
        { type: 'text', content: 'hidden after pause' },
      ]),
      createMessage(
        'four',
        'luke',
        [{ type: 'text', content: 'my own optimistic message' }],
        { login: 'luke', 'user-id': 'self-id' },
      ),
    ];

    const visible = getVisibleMessages(messages, {
      pauseAnchorMessageId: 'two',
      currentUsername: 'luke',
      currentUserId: 'self-id',
    });

    expect(visible.map(message => message.message_id)).toEqual([
      'one',
      'two',
      'four',
    ]);
  });

  test('filters hidden phrases against the flattened message text', () => {
    const messages = [
      createMessage('one', 'alpha', [{ type: 'text', content: 'keep this' }]),
      createMessage('two', 'beta', [
        { type: 'text', content: 'ban this phrase' },
      ]),
    ];

    const visible = getVisibleMessages(messages, {
      hiddenPhrases: ['ban this'],
    });

    expect(visible).toEqual([messages[0]]);
  });

  test('counts only visible non-own messages after the pause anchor', () => {
    const messages = [
      createMessage('one', 'alpha', [
        { type: 'text', content: 'before pause' },
      ]),
      createMessage('two', 'beta', [{ type: 'text', content: 'anchor' }]),
      createMessage(
        'three',
        'gamma',
        [{ type: 'text', content: 'show this hidden-user row' }],
        { login: 'gamma' },
      ),
      createMessage(
        'four',
        'luke',
        [{ type: 'text', content: 'show this own optimistic row' }],
        { login: 'luke', 'user-id': 'self-id' },
      ),
      createMessage(
        'five',
        'delta',
        [{ type: 'text', content: 'show this visible row' }],
        { login: 'delta' },
      ),
      createMessage(
        'six',
        'echo',
        [{ type: 'text', content: 'filtered out by search' }],
        { login: 'echo' },
      ),
    ];

    expect(
      getPausedPendingMessageCount(messages, {
        pauseAnchorMessageId: 'two',
        currentUsername: 'luke',
        currentUserId: 'self-id',
        hiddenUsers: ['gamma'],
        searchQuery: 'show this',
      }),
    ).toBe(1);
  });
});
