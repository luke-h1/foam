import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { AnyChatMessageType } from '../messageHandlers';
import {
  shouldReprocessMessage,
  extractTextFromMessage,
  filterMessagesForReprocessing,
  reprocessMessages,
} from '../reprocessMessages';

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      info: jest.fn(),
      error: jest.fn(),
    },
  },
}));

const createMockUserstate = (
  displayName = 'TestUser',
): AnyChatMessageType['userstate'] => ({
  'display-name': displayName,
  login: displayName.toLowerCase(),
  username: displayName,
  'user-id': '123456',
  id: 'msg-123',
  color: '#FF0000',
  badges: {},
  'badges-raw': '',
  'user-type': '',
  mod: '0',
  subscriber: '0',
  turbo: '0',
  'emote-sets': '',
  'reply-parent-msg-id': '',
  'reply-parent-msg-body': '',
  'reply-parent-display-name': '',
  'reply-parent-user-login': '',
});

const createMockMessage = (
  overrides: Partial<AnyChatMessageType> = {},
): AnyChatMessageType =>
  ({
    id: 'msg-123_nonce-123',
    message_id: 'msg-123',
    message_nonce: 'nonce-123',
    message: [{ type: 'text', content: 'Hello world' }] as ParsedPart[],
    channel: 'testchannel',
    sender: 'TestUser',
    badges: [],
    userstate: createMockUserstate(),
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
    ...overrides,
  }) as AnyChatMessageType;

const createSystemMessage = (): AnyChatMessageType =>
  createMockMessage({
    sender: 'System',
    message: [{ type: 'text', content: 'System message' }] as ParsedPart[],
    userstate: {
      ...createMockUserstate('System'),
      login: 'system',
    },
  });

const createNoticeMessage = (): AnyChatMessageType =>
  ({
    ...createMockMessage(),
    notice_tags: {
      'msg-id': 'sub',
      'msg-param-sub-plan': '1000',
      'msg-param-cumulative-months': '1',
      'msg-param-should-share-streak': '0',
      'msg-param-streak-months': '1',
      'msg-param-sub-plan-name': 'Tier 1',
    },
    sender: 'SubUser',
  }) as AnyChatMessageType;

const createMessageWithEmotes = (): AnyChatMessageType =>
  createMockMessage({
    message: [
      { type: 'text', content: 'Hello ' },
      {
        type: 'emote',
        content: 'Kappa',
        name: 'Kappa',
        original_name: 'Kappa',
        id: 'emote-1',
        url: 'https://example.com/kappa.png',
      },
      { type: 'text', content: ' World' },
    ] as ParsedPart[],
  });

const createMessageWithMention = (): AnyChatMessageType =>
  createMockMessage({
    message: [
      { type: 'text', content: 'Hello ' },
      {
        type: 'mention',
        content: '@username',
        color: '#FF0000',
      },
      { type: 'text', content: ' how are you?' },
    ] as ParsedPart[],
  });

describe('reprocessMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldReprocessMessage', () => {
    test('should return true for regular user messages', () => {
      const message = createMockMessage();
      expect(shouldReprocessMessage(message)).toBe(true);
    });

    test('should return false for system messages', () => {
      const message = createSystemMessage();
      expect(shouldReprocessMessage(message)).toBe(false);
    });

    test('should return false for notice messages', () => {
      const message = createNoticeMessage();
      expect(shouldReprocessMessage(message)).toBe(false);
    });

    test('should return true for messages without notice_tags', () => {
      const message = createMockMessage();
      expect(shouldReprocessMessage(message)).toBe(true);
    });
  });

  describe('extractTextFromMessage', () => {
    test('should extract text from text-only message', () => {
      const message: ParsedPart[] = [{ type: 'text', content: 'Hello world' }];
      expect(extractTextFromMessage(message)).toBe('Hello world');
    });

    test('should convert emotes back to text', () => {
      const message: ParsedPart[] = [
        { type: 'text', content: 'Hello ' },
        {
          type: 'emote',
          content: 'Kappa',
          name: 'Kappa',
          original_name: 'Kappa',
          id: 'emote-1',
          url: 'https://example.com/kappa.png',
        },
        { type: 'text', content: ' World' },
      ];
      expect(extractTextFromMessage(message)).toBe('Hello Kappa World');
    });

    test('should preserve mentions', () => {
      const message: ParsedPart[] = [
        { type: 'text', content: 'Hello ' },
        {
          type: 'mention',
          content: '@user',
          color: '#FF0000',
        },
        { type: 'text', content: ' World' },
      ];
      expect(extractTextFromMessage(message)).toBe('Hello @user  World');
    });

    test('should handle empty message array', () => {
      expect(extractTextFromMessage([])).toBe('');
    });

    test('should handle multiple emotes', () => {
      const message: ParsedPart[] = [
        {
          type: 'emote',
          content: 'Kappa',
          name: 'Kappa',
          original_name: 'Kappa',
          id: 'emote-1',
          url: 'https://example.com/kappa.png',
        },
        { type: 'text', content: ' ' },
        {
          type: 'emote',
          content: 'PogChamp',
          name: 'PogChamp',
          original_name: 'PogChamp',
          id: 'emote-2',
          url: 'https://example.com/pogchamp.png',
        },
      ];
      expect(extractTextFromMessage(message)).toBe('Kappa PogChamp');
    });
  });

  describe('filterMessagesForReprocessing', () => {
    test('should filter out system messages', () => {
      const messages = [
        createMockMessage({ message_id: '1' }),
        createSystemMessage(),
        createMockMessage({ message_id: '2' }),
      ];

      const result = filterMessagesForReprocessing(messages);

      expect(result).toHaveLength(2);
      expect(result.every(m => m.sender !== 'System')).toBe(true);
    });

    test('should filter out notice messages', () => {
      const messages = [
        createMockMessage({ message_id: '1' }),
        createNoticeMessage(),
        createMockMessage({ message_id: '2' }),
      ];

      const result = filterMessagesForReprocessing(messages);

      expect(result).toHaveLength(2);
      expect(result.every(m => !('notice_tags' in m && m.notice_tags))).toBe(
        true,
      );
    });

    test('should return empty array for empty input', () => {
      expect(filterMessagesForReprocessing([])).toEqual([]);
    });

    test('should return all messages if none are system or notice', () => {
      const messages = [
        createMockMessage({ message_id: '1' }),
        createMockMessage({ message_id: '2' }),
        createMockMessage({ message_id: '3' }),
      ];

      const result = filterMessagesForReprocessing(messages);

      expect(result).toHaveLength(3);
    });

    test('should return empty array if all are system or notice', () => {
      const messages = [createSystemMessage(), createNoticeMessage()];

      const result = filterMessagesForReprocessing(messages);

      expect(result).toHaveLength(0);
    });
  });

  describe('reprocessMessages', () => {
    test('should call processMessageEmotes for each valid message', () => {
      const messages = [
        createMockMessage({ message_id: '1' }),
        createMockMessage({ message_id: '2' }),
      ];
      const processMessageEmotes = jest.fn();

      reprocessMessages(messages, processMessageEmotes);

      expect(processMessageEmotes).toHaveBeenCalledTimes(2);
    });

    test('should not call processMessageEmotes for system messages', () => {
      const messages = [createSystemMessage()];
      const processMessageEmotes = jest.fn();

      reprocessMessages(messages, processMessageEmotes);

      expect(processMessageEmotes).not.toHaveBeenCalled();
    });

    test('should not call processMessageEmotes for notice messages', () => {
      const messages = [createNoticeMessage()];
      const processMessageEmotes = jest.fn();

      reprocessMessages(messages, processMessageEmotes);

      expect(processMessageEmotes).not.toHaveBeenCalled();
    });

    test('should pass correct arguments to processMessageEmotes', () => {
      const message = createMessageWithEmotes();
      const processMessageEmotes = jest.fn();

      reprocessMessages([message], processMessageEmotes);

      expect(processMessageEmotes).toHaveBeenCalledWith(
        'Hello Kappa World',
        message.userstate,
        message,
      );
    });

    test('should handle empty message array', () => {
      const processMessageEmotes = jest.fn();

      reprocessMessages([], processMessageEmotes);

      expect(processMessageEmotes).not.toHaveBeenCalled();
    });

    test('should skip messages with empty text content', () => {
      const message = createMockMessage({
        message: [{ type: 'text', content: '   ' }] as ParsedPart[],
      });
      const processMessageEmotes = jest.fn();

      reprocessMessages([message], processMessageEmotes);

      expect(processMessageEmotes).not.toHaveBeenCalled();
    });

    test('should process messages with mentions', () => {
      const message = createMessageWithMention();
      const processMessageEmotes = jest.fn();

      reprocessMessages([message], processMessageEmotes);

      expect(processMessageEmotes).toHaveBeenCalledWith(
        'Hello @username  how are you?',
        message.userstate,
        message,
      );
    });

    test('should process mixed message types correctly', () => {
      const messages = [
        createMockMessage({ message_id: '1' }),
        createSystemMessage(),
        createMessageWithEmotes(),
        createNoticeMessage(),
        createMessageWithMention(),
      ];
      const processMessageEmotes = jest.fn();

      reprocessMessages(messages, processMessageEmotes);

      // Should only process 3: regular message, message with emotes, message with mention
      expect(processMessageEmotes).toHaveBeenCalledTimes(3);
    });

    test('should extract original emote names when reprocessing', () => {
      const message = createMockMessage({
        message: [
          { type: 'text', content: 'Check this ' },
          {
            type: 'emote',
            content: 'OMEGALUL',
            name: 'OMEGALUL',
            original_name: 'OMEGALUL',
            id: 'emote-7tv',
            url: 'https://cdn.7tv.app/emote/123.webp',
          },
        ] as ParsedPart[],
      });
      const processMessageEmotes = jest.fn();

      reprocessMessages([message], processMessageEmotes);

      expect(processMessageEmotes).toHaveBeenCalledWith(
        'Check this OMEGALUL',
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
