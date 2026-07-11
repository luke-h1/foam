import { createChatMessageFixture } from '@app/components/Chat/util/__tests__/__fixtures__/chatMessage.fixture';

import { isRenderableChatMessage } from '../isRenderableChatMessage';

describe('isRenderableChatMessage', () => {
  test('returns false for undefined messages', () => {
    expect(isRenderableChatMessage(undefined)).toBe(false);
  });

  test('returns false when message_id or message_nonce is missing', () => {
    expect(
      isRenderableChatMessage(
        createChatMessageFixture({
          message_id: '',
          message_nonce: 'nonce-1',
        }),
      ),
    ).toBe(false);
    expect(
      isRenderableChatMessage(
        createChatMessageFixture({ message_id: 'msg-1', message_nonce: '' }),
      ),
    ).toBe(false);
  });

  test('returns false when ids are whitespace only', () => {
    expect(
      isRenderableChatMessage(
        createChatMessageFixture({
          message_id: '   ',
          message_nonce: 'nonce-1',
        }),
      ),
    ).toBe(false);
  });

  test('returns true for messages with both ids', () => {
    expect(isRenderableChatMessage(createChatMessageFixture())).toBe(true);
  });
});
