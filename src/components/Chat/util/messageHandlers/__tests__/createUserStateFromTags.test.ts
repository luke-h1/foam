import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';

import { createUserStateFromTags } from '../createUserStateFromTags';

describe('createUserStateFromTags', () => {
  test('should create userstate from basic tags', () => {
    const tags = {
      'display-name': 'TestUser',
      login: 'testuser',
      color: '#FF5500',
      badges: 'subscriber/12,premium/1',
      mod: '0',
      subscriber: '1',
    };

    const result = createUserStateFromTags(tags);

    expect(result).toEqual<UserStateTags>({
      'display-name': 'TestUser',
      login: 'testuser',
      username: 'TestUser',
      color: '#FF5500',
      'badges-raw': 'subscriber/12,premium/1',
      badges: { subscriber: '12', premium: '1' },
      mod: '0',
      subscriber: '1',
      'user-type': undefined,
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    });
  });

  test('should handle missing display-name by using login', () => {
    const tags = {
      login: 'testuser',
    };

    const result = createUserStateFromTags(tags);

    // When display-name is missing, username falls back to login.
    expect(result).toEqual<UserStateTags>({
      login: 'testuser',
      username: 'testuser',
      'badges-raw': '',
      badges: {},
      'user-type': undefined,
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    });
  });

  test('should handle missing login by using lowercase display-name', () => {
    const tags = {
      'display-name': 'TestUser',
    };

    const result = createUserStateFromTags(tags);

    expect(result).toEqual<UserStateTags>({
      'display-name': 'TestUser',
      login: 'testuser',
      username: 'TestUser',
      'badges-raw': '',
      badges: {},
      'user-type': undefined,
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    });
  });

  test('should include reply parent information', () => {
    const tags = {
      'display-name': 'TestUser',
      login: 'testuser',
      'reply-parent-msg-id': 'parent-123',
      'reply-parent-msg-body': 'Hello world',
      'reply-parent-display-name': 'ParentUser',
      'reply-parent-user-login': 'parentuser',
    };

    const result = createUserStateFromTags(tags);

    const replyFields = {
      'reply-parent-msg-id': result['reply-parent-msg-id'],
      'reply-parent-msg-body': result['reply-parent-msg-body'],
      'reply-parent-display-name': result['reply-parent-display-name'],
      'reply-parent-user-login': result['reply-parent-user-login'],
    };

    expect(replyFields).toEqual({
      'reply-parent-msg-id': 'parent-123',
      'reply-parent-msg-body': 'Hello world',
      'reply-parent-display-name': 'ParentUser',
      'reply-parent-user-login': 'parentuser',
    });
  });

  test('should default reply fields to empty strings', () => {
    const tags = {
      'display-name': 'TestUser',
      login: 'testuser',
    };

    const result = createUserStateFromTags(tags);

    const replyFields = {
      'reply-parent-msg-id': result['reply-parent-msg-id'],
      'reply-parent-msg-body': result['reply-parent-msg-body'],
      'reply-parent-display-name': result['reply-parent-display-name'],
      'reply-parent-user-login': result['reply-parent-user-login'],
    };

    expect(replyFields).toEqual({
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    });
  });
});
