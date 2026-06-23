import { createChatMessage } from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';

import { type BufferedMessage, createMessageBuffer } from '../messageBuffer';

jest.mock('@app/store/chat/actions/messages', () => ({
  getMaxChatMessages: jest.fn(() => 1000),
}));

jest.mock('@app/utils/chat/replaceEmotesWithText', () => ({
  replaceEmotesWithText: (parts: { content?: string }[]) =>
    parts.map(part => part.content ?? '').join(''),
}));

function message(id: string, overrides: Partial<BufferedMessage> = {}) {
  return {
    ...createChatMessage({ tags: { id, login: id }, text: id }),
    ...overrides,
  } as BufferedMessage;
}

describe('createMessageBuffer add/drain', () => {
  test('appends new messages and drains them in order, clearing the buffer', () => {
    const buffer = createMessageBuffer(() => 1000);

    expect(buffer.add(message('a'))).toEqual({ added: true, dropped: 0 });
    expect(buffer.add(message('b'))).toEqual({ added: true, dropped: 0 });
    expect(buffer.size()).toBe(2);

    const drained = buffer.drain();
    expect(drained.map(m => m.message_id)).toEqual(['a', 'b']);
    expect(buffer.size()).toBe(0);
  });

  test('merges a same-key message and keeps the existing cached colour', () => {
    const buffer = createMessageBuffer(() => 1000);

    buffer.add(message('a', { cachedSenderColor: 'red' }));
    const result = buffer.add(message('a', { cachedSenderColor: 'blue' }));

    expect(result).toEqual({ added: false, dropped: 0 });
    expect(buffer.size()).toBe(1);
    expect(buffer.drain()[0]!.cachedSenderColor).toBe('red');
  });

  test('drops the oldest entries past the cap and reports the dropped count', () => {
    const buffer = createMessageBuffer(() => 2);

    buffer.add(message('a'));
    buffer.add(message('b'));
    const result = buffer.add(message('c'));

    expect(result).toEqual({ added: true, dropped: 1 });
    expect(buffer.drain().map(m => m.message_id)).toEqual(['b', 'c']);
  });
});

describe('createMessageBuffer edits', () => {
  test('removes a buffered message by id', () => {
    const buffer = createMessageBuffer(() => 1000);
    buffer.add(message('a'));
    buffer.add(message('b'));

    expect(buffer.removeById('a')).toBe(true);
    expect(buffer.drain().map(m => m.message_id)).toEqual(['b']);
  });

  test('removes every buffered message from a login', () => {
    const buffer = createMessageBuffer(() => 1000);
    buffer.add(message('a'));
    buffer.add(message('b'));

    expect(buffer.removeByLogin('a')).toBe(true);
    expect(buffer.drain().map(m => m.message_id)).toEqual(['b']);
  });

  test('replaces a moderated message body with the notice', () => {
    const buffer = createMessageBuffer(() => 1000);
    buffer.add(message('a'));

    buffer.moderateById('a', 'Deleted by a moderator');

    const [moderated] = buffer.drain();
    expect(moderated!.message).toEqual([
      { type: 'text', content: 'a—Deleted by a moderator' },
    ]);
    expect(moderated!.moderationNotice).toBe('Deleted by a moderator');
  });

  test('clears the buffer', () => {
    const buffer = createMessageBuffer(() => 1000);
    buffer.add(message('a'));

    buffer.clear();

    expect(buffer.size()).toBe(0);
  });
});
