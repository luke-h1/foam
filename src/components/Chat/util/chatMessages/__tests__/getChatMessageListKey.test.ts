import { createChatMessageFixture } from '@app/components/Chat/util/__tests__/__fixtures__/chatMessage.fixture';

import { getChatMessageListKey } from '../getChatMessageListKey';

describe('getChatMessageListKey', () => {
  test('returns the message id when present', () => {
    expect(getChatMessageListKey(createChatMessageFixture())).toBe(
      'msg-1_nonce-1',
    );
  });

  test('returns missing-chat-message for undefined input', () => {
    expect(getChatMessageListKey(undefined)).toBe('missing-chat-message');
  });

  test('falls back to message_id and nonce when id is blank', () => {
    expect(
      getChatMessageListKey(
        createChatMessageFixture({
          id: '   ',
          message_id: 'msg-2',
          message_nonce: 'nonce-2',
        }),
      ),
    ).toBe('msg-2_nonce-2');
  });

  test('assigns stable fallback keys for invalid messages', () => {
    const invalidMessage = createChatMessageFixture({
      id: '',
      message_id: '',
      message_nonce: '',
    });

    const firstKey = getChatMessageListKey(invalidMessage);
    const secondKey = getChatMessageListKey(invalidMessage);

    expect(firstKey).toBe(secondKey);
    expect(firstKey.startsWith('invalid-message-')).toBe(true);
  });

  test('assigns unique fallback keys for different invalid messages', () => {
    const firstInvalid = createChatMessageFixture({
      id: '',
      message_id: '',
      message_nonce: '',
    });
    const secondInvalid = createChatMessageFixture({
      id: '',
      message_id: '',
      message_nonce: '',
    });

    expect(getChatMessageListKey(firstInvalid)).not.toBe(
      getChatMessageListKey(secondInvalid),
    );
  });
});
