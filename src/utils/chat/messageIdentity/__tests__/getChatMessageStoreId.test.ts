import { createChatMessageFixture } from '@app/components/Chat/util/__tests__/__fixtures__/chatMessage.fixture';
import { getChatMessageKey } from '@app/utils/chat/messageIdentity/getChatMessageKey';
import { getChatMessageListKey } from '@app/utils/chat/messageIdentity/getChatMessageListKey';
import { getChatMessageStoreId } from '@app/utils/chat/messageIdentity/getChatMessageStoreId';

describe('getChatMessageKey', () => {
  test('joins the trimmed id and nonce', () => {
    expect(getChatMessageKey(' abc ', ' def ')).toBe('abc_def');
  });
});

describe('getChatMessageStoreId', () => {
  test('prefers the store-assigned id', () => {
    expect(
      getChatMessageStoreId({
        id: 'assigned-id',
        message_id: 'abc',
        message_nonce: 'def',
      }),
    ).toBe('assigned-id');
  });

  test('falls back to the composed key before commit', () => {
    expect(
      getChatMessageStoreId({
        message_id: 'abc',
        message_nonce: 'def',
      }),
    ).toBe('abc_def');
  });
});

describe('message identity agreement', () => {
  /**
   * ChatMessagePane drops its render-time dedup on the strength of the store's
   * key and the list's key being the same string. If these ever diverge the
   * list silently renders duplicate rows, so pin the agreement here.
   */
  test('the list key and the store id agree for a renderable message', () => {
    const message = createChatMessageFixture();

    expect(getChatMessageListKey(message)).toBe(getChatMessageStoreId(message));
  });

  test('agreement survives an uncommitted message with no store id', () => {
    const message = { ...createChatMessageFixture(), id: '' };

    expect(getChatMessageListKey(message)).toBe(getChatMessageStoreId(message));
    expect(getChatMessageListKey(message)).toBe(
      getChatMessageKey(message.message_id, message.message_nonce),
    );
  });
});
