import { AnyChatMessageType } from '@app/components/Chat/util/messageHandlers';

import { filterMessagesForReprocessing } from '../filterMessagesForReprocessing';
import {
  createMockMessage,
  createNoticeMessage,
  createSystemMessage,
} from './__fixtures__/prepareMessagesForReprocessing.fixture';

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
    expect(filterMessagesForReprocessing([])).toEqual<AnyChatMessageType[]>([]);
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
