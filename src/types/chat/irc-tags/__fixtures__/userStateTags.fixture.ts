import type { UserStateTags } from '../userstate';

export function createUserStateTags(
  overrides: Partial<UserStateTags> = {},
): UserStateTags {
  return {
    username: 'testuser',
    'display-name': 'TestUser',
    login: 'testuser',
    color: '#FF0000',
    'user-id': '123456',
    id: 'msg-123',
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
    ...overrides,
  };
}
