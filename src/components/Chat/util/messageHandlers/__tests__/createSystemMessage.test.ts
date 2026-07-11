import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { createSystemMessage } from '../createSystemMessage';

jest.mock('@app/utils/string/generateNonce', () => ({
  generateNonce: jest.fn().mockReturnValue('test-nonce-123'),
}));

describe('createSystemMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a system message', () => {
    const result = createSystemMessage('testchannel', 'Connection established');

    expect(result.channel).toBe('testchannel');
    expect(result.sender).toBe('System');
    expect(result.message).toEqual<ParsedPart[]>([
      { type: 'text', content: 'Connection established' },
    ]);
  });

  test('should have system userstate', () => {
    const result = createSystemMessage('testchannel', 'Test message');

    expect(result.userstate['display-name']).toBe('System');
    expect(result.userstate.login).toBe('system');
    expect(result.userstate.color).toBe('#808080');
  });

  test('should generate unique message IDs', () => {
    const result1 = createSystemMessage('channel', 'Message 1');
    const result2 = createSystemMessage('channel', 'Message 2');

    expect(result1.message_id).toMatch(/^system-/);
    expect(result2.message_id).toMatch(/^system-/);
  });

  test('should have empty badges', () => {
    const result = createSystemMessage('testchannel', 'Test');

    expect(result.badges).toEqual<SanitisedBadgeSet[]>([]);
  });
});
