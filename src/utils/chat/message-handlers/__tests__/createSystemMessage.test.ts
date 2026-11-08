import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import * as generateNonceModule from '@app/utils/string/generateNonce';

import { createSystemMessage } from '../createSystemMessage';

describe('createSystemMessage', () => {
  beforeEach(() => {
    jest
      .spyOn(generateNonceModule, 'generateNonce')
      .mockReturnValue('test-nonce-123');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates a system message', () => {
    const result = createSystemMessage(
      'testchannel',
      'Connection established',
      '24h',
    );

    expect(result.channel).toBe('testchannel');

    expect(result.sender).toBe('System');

    expect(result.message).toEqual<MessageToken[]>([
      { type: 'text', content: 'Connection established' },
    ]);
  });

  test('has system userstate', () => {
    const result = createSystemMessage('testchannel', 'Test message', '24h');

    expect(result.userstate['display-name']).toBe('System');

    expect(result.userstate.login).toBe('system');

    expect(result.userstate.color).toBe('#808080');
  });

  test('builds the message id from the clock and the nonce', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    const result = createSystemMessage('channel', 'Message 1', '24h');

    expect({ id: result.id, messageId: result.message_id }).toEqual({
      id: 'system-1700000000000_test-nonce-123',
      messageId: 'system-1700000000000',
    });
  });

  test('has empty badges', () => {
    const result = createSystemMessage('testchannel', 'Test', '24h');

    expect(result.badges).toEqual<SanitisedBadgeSet[]>([]);
  });
});
