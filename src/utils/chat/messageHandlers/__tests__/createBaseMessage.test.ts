import type { ParsedPart } from '@app/utils/chat/parsedPart';
import * as generateNonceModule from '@app/utils/string/generateNonce';

import { createBaseMessage } from '../createBaseMessage';

describe('createBaseMessage', () => {
  beforeEach(() => {
    jest
      .spyOn(generateNonceModule, 'generateNonce')
      .mockReturnValue('test-nonce-123');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates a base message with required fields', () => {
    const params = {
      tags: {
        'display-name': 'TestUser',
        login: 'testuser',
        id: 'msg-123',
        color: '#FF0000',
      },
      channelName: 'testchannel',
      text: 'Hello world!',
    };

    const result = createBaseMessage(params);

    expect(result.channel).toBe('testchannel');
    expect(result.sender).toBe('TestUser');
    expect(result.message_id).toBe('msg-123');
    expect(result.message).toEqual<ParsedPart[]>([
      { type: 'text', content: 'Hello world!' },
    ]);
  });

  test('trims trailing whitespace from text', () => {
    const params = {
      tags: {
        'display-name': 'TestUser',
        login: 'testuser',
        id: 'msg-123',
      },
      channelName: 'testchannel',
      text: 'Hello world!   \n\n',
    };

    const result = createBaseMessage(params);

    expect(result.message[0]).toEqual<ParsedPart>({
      type: 'text',
      content: 'Hello world!',
    });
  });

  test('marks Highlight My Message PRIVMSG tags as highlighted', () => {
    const params = {
      tags: {
        'display-name': 'Rexdain',
        login: 'rexdain',
        id: 'msg-highlight-123',
        'msg-id': 'highlighted-message',
        'custom-reward-id': 'reward-highlight',
      },
      channelName: 'testchannel',
      text: 'Kappa',
    };

    const result = createBaseMessage(params);

    expect(result.isHighlightedMessage).toBe(true);
    expect(result.isChannelPointRedemption).toBe(true);
    expect(result.userstate['msg-id']).toBe('highlighted-message');
  });

  test('uses the Twitch message id for message_nonce when present', () => {
    const params = {
      tags: {
        'display-name': 'TestUser',
        login: 'testuser',
        id: 'msg-123',
      },
      channelName: 'testchannel',
      text: 'Hello',
    };

    const result = createBaseMessage(params);

    expect(result.message_nonce).toBe('msg-123');
  });

  test('defaults message_id to "0" when id not in tags', () => {
    const params = {
      tags: {
        'display-name': 'TestUser',
        login: 'testuser',
      },
      channelName: 'testchannel',
      text: 'Hello',
    };

    const result = createBaseMessage(params);

    expect(result.message_id).toBe('0');
    expect(result.message_nonce).toBe('test-nonce-123');
  });
});
