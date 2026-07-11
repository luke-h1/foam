import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import {
  createEmotePart,
  createMentionPart,
  createTextPart,
} from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

import {
  createMockMessage,
  createNoticeMessage,
  createSystemMessage,
} from '../prepareMessagesForReprocessing/__tests__/__fixtures__/prepareMessagesForReprocessing.fixture';
import { reprocessMessages } from '../reprocessMessages';

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      info: jest.fn(),
      error: jest.fn(),
    },
  },
}));

const createMessageWithEmotes = (): AnyChatMessageType =>
  createMockMessage({
    message: [
      createTextPart('Hello '),
      createEmotePart('Kappa', {
        name: 'Kappa',
        original_name: 'Kappa',
        id: 'emote-1',
        url: 'https://example.com/kappa.png',
      }),
      createTextPart(' World'),
    ],
  });

const createMessageWithMention = (): AnyChatMessageType =>
  createMockMessage({
    message: [
      createTextPart('Hello '),
      createMentionPart('@username', { color: '#FF0000' }),
      createTextPart(' how are you?'),
    ],
  });

describe('reprocessMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      message: [createTextPart('   ')],
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
        createTextPart('Check this '),
        createEmotePart('OMEGALUL', {
          name: 'OMEGALUL',
          original_name: 'OMEGALUL',
          id: 'emote-7tv',
          url: 'https://cdn.7tv.app/emote/123.webp',
        }),
      ],
    });
    const processMessageEmotes = jest.fn();

    reprocessMessages([message], processMessageEmotes);

    expect(processMessageEmotes).toHaveBeenCalledWith(
      'Check this OMEGALUL',
      message.userstate,
      message,
    );
  });
});
