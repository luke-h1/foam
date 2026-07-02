import { createChatMessage } from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';

import type { BufferedMessage } from '../bufferedMessageOps';
import { createChatDelayQueue } from '../chatDelayQueue';

jest.mock('@app/utils/chat/replaceEmotesWithText', () => ({
  replaceEmotesWithText: (parts: { content?: string }[]) =>
    parts.map(part => part.content ?? '').join(''),
}));

function message(
  id: string,
  login = id,
  overrides: Partial<BufferedMessage> = {},
) {
  return {
    ...createChatMessage({ tags: { id, login }, text: id }),
    ...overrides,
  } as BufferedMessage;
}

describe('createChatDelayQueue release timing', () => {
  test('releases only entries whose releaseAt is due, in arrival order', () => {
    const queue = createChatDelayQueue();

    queue.enqueue(message('a'), 1_000, true);
    queue.enqueue(message('b'), 2_000, true);
    queue.enqueue(message('c'), 3_000, true);

    expect(queue.drainDue(500).map(entry => entry.message.message_id)).toEqual(
      [],
    );
    expect(
      queue.drainDue(2_000).map(entry => entry.message.message_id),
    ).toEqual(['a', 'b']);
    expect(queue.size()).toBe(1);
    expect(queue.peekNextReleaseAt()).toBe(3_000);
  });

  test('stops at the first not-due entry so a shorter later delay cannot jump ahead', () => {
    const queue = createChatDelayQueue();

    // 'a' was enqueued with a long delay, 'b' arrived later with a short one.
    queue.enqueue(message('a'), 5_000, true);
    queue.enqueue(message('b'), 1_000, true);

    // 'b' is due by the clock but stays behind 'a' to preserve arrival order.
    expect(queue.drainDue(2_000)).toEqual([]);
    expect(
      queue.drainDue(5_000).map(entry => entry.message.message_id),
    ).toEqual(['a', 'b']);
  });

  test('drainAll empties the queue regardless of release time', () => {
    const queue = createChatDelayQueue();
    queue.enqueue(message('a'), 10_000, true);
    queue.enqueue(message('b'), 20_000, false);

    const all = queue.drainAll();
    expect(all.map(entry => entry.message.message_id)).toEqual(['a', 'b']);
    expect(all.map(entry => entry.countUnread)).toEqual([true, false]);
    expect(queue.size()).toBe(0);
    expect(queue.peekNextReleaseAt()).toBeNull();
  });

  test('drops the oldest entries past the safety cap', () => {
    const queue = createChatDelayQueue(2);
    queue.enqueue(message('a'), 1_000, true);
    queue.enqueue(message('b'), 1_000, true);
    queue.enqueue(message('c'), 1_000, true);

    expect(queue.drainAll().map(entry => entry.message.message_id)).toEqual([
      'b',
      'c',
    ]);
  });
});

describe('createChatDelayQueue moderation', () => {
  test('removes a held message by id before it can be released', () => {
    const queue = createChatDelayQueue();
    queue.enqueue(message('a'), 1_000, true);
    queue.enqueue(message('b'), 1_000, true);

    queue.removeById('a');

    expect(
      queue.drainDue(1_000).map(entry => entry.message.message_id),
    ).toEqual(['b']);
  });

  test('removes held messages by login', () => {
    const queue = createChatDelayQueue();
    queue.enqueue(message('a', 'spammer'), 1_000, true);
    queue.enqueue(message('b', 'regular'), 1_000, true);

    queue.removeByLogin('spammer');

    expect(
      queue.drainDue(1_000).map(entry => entry.message.message_id),
    ).toEqual(['b']);
  });

  test('moderates a held message by id in place', () => {
    const queue = createChatDelayQueue();
    queue.enqueue(message('a'), 1_000, true);

    queue.moderateById('a', 'Deleted');

    const [released] = queue.drainDue(1_000);
    expect(released!.message.moderationNotice).toBe('Deleted');
  });
});
