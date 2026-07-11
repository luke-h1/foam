import { shouldReprocessMessage } from '../shouldReprocessMessage';
import {
  createMockMessage,
  createNoticeMessage,
  createSystemMessage,
} from './__fixtures__/prepareMessagesForReprocessing.fixture';

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
