import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import { getChatRowItemType } from '@app/components/chat/util/chatRowItemType';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import { createTextToken } from '@app/utils/chat/__tests__/__fixtures__/messageToken.fixture';

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
        replyParentLogin: '',
        parentDisplayName: '',
        userstate: createUserStateTags(),
      }),
    ).toBe('invalid');
  });

  test('returns body variant for subscription notices', () => {
    const message = createChatMessageFixture({
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
    const bareSub = createChatMessageFixture({
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

    const resubWithMessage = createChatMessageFixture({
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
    const plain = createChatMessageFixture();
    const moderated = createChatMessageFixture({ moderationNotice: 'Deleted' });

    const reply = createChatMessageFixture({
      parentDisplayName: 'Parent',
      replyBody: 'hi',
    });

    expect(getChatRowItemType(plain)).toBe('user_chat-inline-w0');

    expect(getChatRowItemType(moderated)).toBe('user_chat-mod-w0');

    expect(getChatRowItemType(reply)).toBe('user_chat-reply-inline-w0');
  });

  test('omits reply pool when inline reply context is disabled', () => {
    const reply = createChatMessageFixture({
      parentDisplayName: 'Parent',
      replyBody: 'hi',
    });

    expect(getChatRowItemType(reply, { showInlineReplyContext: false })).toBe(
      'user_chat-inline-w0',
    );
  });

  test('splits user chat rows by how much room their content needs', () => {
    const short = createChatMessageFixture({
      message: [createTextToken('gg')],
    });

    const copypasta = createChatMessageFixture({
      message: [
        createTextToken('OHNE YOU JUST DECLINED A 0.000005 FLOAT '.repeat(8)),
      ],
    });

    expect(getChatRowItemType(short)).toBe('user_chat-inline-w0');

    expect(getChatRowItemType(copypasta)).toBe('user_chat-inline-w6');
  });

  test('splits rows whose body cannot flow inline from inline rows', () => {
    const cheer = createChatMessageFixture({
      message: [
        createTextToken('gg '),
        {
          type: 'cheermote',
          content: 'Cheer100',
          cheermote: {
            bits: 100,
            color: '#9c3ee8',
            prefix: 'Cheer',
            static_url: 'https://cdn.example.test/cheer.png',
            url: 'https://cdn.example.test/cheer.gif',
          },
        },
      ],
    });

    expect(getChatRowItemType(cheer)).toBe('user_chat-w0');
  });
});
