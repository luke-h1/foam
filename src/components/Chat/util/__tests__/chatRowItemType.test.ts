import { getChatRowItemType } from '../chatRowItemType';
import type { AnyChatMessageType } from '../messageHandlers';

function createUserChatMessage(
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType {
  return {
    id: 'msg-1',
    message_id: 'msg-1',
    message_nonce: 'nonce-1',
    channel: 'channel',
    sender: 'viewer',
    message: [{ type: 'text', content: 'hello' }],
    userstate: {
      username: 'Viewer',
      login: 'viewer',
      'user-id': '123',
      color: '#FFFFFF',
      badges: {},
      'badges-raw': '',
    },
    badges: {},
    ...overrides,
  } as AnyChatMessageType;
}

describe('getChatRowItemType', () => {
  test('returns invalid for malformed rows', () => {
    expect(getChatRowItemType({} as AnyChatMessageType)).toBe('invalid');
  });

  test('returns body variant for subscription notices', () => {
    const message = createUserChatMessage({
      isSpecialNotice: true,
      message: [
        {
          type: 'sub',
          subscriptionEvent: {
            msgId: 'sub',
            displayName: 'NewSubscriber',
            plan: '1000',
            months: 1,
          },
        },
      ],
    });

    expect(getChatRowItemType(message)).toBe('subscription');
  });

  test('splits user chat rows with incompatible native trees', () => {
    const plain = createUserChatMessage();
    const moderated = createUserChatMessage({ moderationNotice: 'Deleted' });
    const reply = createUserChatMessage({
      parentDisplayName: 'Parent',
      replyBody: 'hi',
    });

    expect(getChatRowItemType(plain)).toBe('user_chat');
    expect(getChatRowItemType(moderated)).toBe('user_chat-mod');
    expect(getChatRowItemType(reply)).toBe('user_chat-reply');
    expect(getChatRowItemType(moderated)).not.toBe(getChatRowItemType(reply));
  });

  test('omits reply pool when inline reply context is disabled', () => {
    const reply = createUserChatMessage({
      parentDisplayName: 'Parent',
      replyBody: 'hi',
    });

    expect(getChatRowItemType(reply, { showInlineReplyContext: false })).toBe(
      'user_chat',
    );
  });
});
