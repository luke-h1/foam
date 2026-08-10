import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import { createTextPart } from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

import { getChatRowItemType } from '../chatRowItemType';

function createUserChatMessage(
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType {
  return {
    id: 'msg-1',
    message_id: 'msg-1',
    message_nonce: 'nonce-1',
    channel: 'channel',
    sender: 'viewer',
    message: [createTextPart('hello')],
    userstate: createUserStateTags({
      username: 'Viewer',
      login: 'viewer',
      'user-id': '123',
      color: '#FFFFFF',
    }),
    badges: [],
    replyBody: '',
    replyDisplayName: '',
    parentDisplayName: '',
    ...overrides,
  };
}

describe('getChatRowItemType', () => {
  test('returns invalid for malformed rows', () => {
    expect(
      getChatRowItemType({
        id: '',
        message_id: '',
        message_nonce: '',
        channel: '',
        sender: '',
        message: [],
        badges: [],
        replyBody: '',
        replyDisplayName: '',
        parentDisplayName: '',
        userstate: createUserStateTags(),
      }),
    ).toBe('invalid');
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

    expect(getChatRowItemType(message)).toBe('subscription-w3');
  });

  test('splits notice rows of the same variant by how tall they render', () => {
    const bareSub = createUserChatMessage({
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
    const resubWithMessage = createUserChatMessage({
      isSpecialNotice: true,
      message: [
        {
          type: 'resub',
          subscriptionEvent: {
            msgId: 'resub',
            displayName: 'NewSubscriber',
            plan: '1000',
            months: 27,
            message:
              'been here since the beginning and I am not going anywhere, thank you for all the streams this year',
          },
        },
      ],
    });

    expect(getChatRowItemType(bareSub)).not.toBe(
      getChatRowItemType(resubWithMessage),
    );
  });

  test('splits user chat rows with incompatible native trees', () => {
    const plain = createUserChatMessage();
    const moderated = createUserChatMessage({ moderationNotice: 'Deleted' });
    const reply = createUserChatMessage({
      parentDisplayName: 'Parent',
      replyBody: 'hi',
    });

    expect(getChatRowItemType(plain)).toBe('user_chat-w0');
    expect(getChatRowItemType(moderated)).toBe('user_chat-mod-w0');
    expect(getChatRowItemType(reply)).toBe('user_chat-reply-w0');
    expect(getChatRowItemType(moderated)).not.toBe(getChatRowItemType(reply));
  });

  test('omits reply pool when inline reply context is disabled', () => {
    const reply = createUserChatMessage({
      parentDisplayName: 'Parent',
      replyBody: 'hi',
    });

    expect(getChatRowItemType(reply, { showInlineReplyContext: false })).toBe(
      'user_chat-w0',
    );
  });

  test('splits user chat rows by how much room their content needs', () => {
    const short = createUserChatMessage({ message: [createTextPart('gg')] });
    const copypasta = createUserChatMessage({
      message: [
        createTextPart('OHNE YOU JUST DECLINED A 0.000005 FLOAT '.repeat(8)),
      ],
    });

    expect(getChatRowItemType(short)).toBe('user_chat-w0');
    expect(getChatRowItemType(copypasta)).toBe('user_chat-w6');
  });
});
