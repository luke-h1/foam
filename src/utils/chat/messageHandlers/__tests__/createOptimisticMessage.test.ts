import { createOptimisticMessage } from '@app/utils/chat/messageHandlers/createOptimisticMessage';
import {
  createOptimisticUserState,
  type OptimisticReplyTarget,
} from '@app/utils/chat/messageHandlers/createOptimisticUserState';

const SENT_AT = 1_754_000_000_000;

const user = {
  id: 'user-1',
  login: 'viewer',
  display_name: 'Viewer',
};

describe('createOptimisticUserState', () => {
  test('fills the sender fields from the authenticated user', () => {
    const userstate = createOptimisticUserState({
      currentUserState: { badges: 'moderator/1', color: '#00ff00' },
      user,
    });

    expect(userstate['display-name']).toBe('Viewer');
    expect(userstate.login).toBe('viewer');
    expect(userstate.username).toBe('Viewer');
    expect(userstate['user-id']).toBe('user-1');
    expect(userstate.color).toBe('#00ff00');
    expect(userstate.badges).toEqual({ moderator: '1' });
  });

  test('generates a colour when the userstate has none', () => {
    const userstate = createOptimisticUserState({
      currentUserState: {},
      user,
    });

    expect(userstate.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test('leaves the reply-parent tags empty without a reply target', () => {
    const userstate = createOptimisticUserState({
      currentUserState: {},
      user,
    });

    expect(userstate['reply-parent-msg-id']).toBe('');
    expect(userstate['reply-parent-display-name']).toBe('');
    expect(userstate['reply-parent-msg-body']).toBe('');
    expect(userstate['reply-parent-user-login']).toBe('');
  });

  test('carries the reply target into the reply-parent tags', () => {
    const replyTo: OptimisticReplyTarget = {
      messageId: 'parent-1',
      message: 'parent body',
      username: 'Parent',
      replyParentUserLogin: 'parent',
    };

    const userstate = createOptimisticUserState({
      currentUserState: {},
      replyTo,
      user,
    });

    expect(userstate['reply-parent-msg-id']).toBe('parent-1');
    expect(userstate['reply-parent-msg-body']).toBe('parent body');
    expect(userstate['reply-parent-display-name']).toBe('Parent');
    expect(userstate['reply-parent-user-login']).toBe('parent');
  });
});

describe('createOptimisticMessage', () => {
  const userstate = createOptimisticUserState({
    currentUserState: {},
    user,
  });

  test('keys the echo off the send time so it cannot collide with the real message', () => {
    const message = createOptimisticMessage({
      badges: [],
      channelName: 'somechannel',
      isAction: false,
      messageText: 'hello there  ',
      sentAt: SENT_AT,
      user,
      userstate,
    });

    expect(message.message_id).toBe(String(SENT_AT));
    expect(message.message_nonce).toBe(String(SENT_AT));
    expect(message.id).toBe(`${SENT_AT}_${SENT_AT}`);
    expect(message.message).toEqual([
      { type: 'text', content: 'hello there' },
    ]);
    expect(message.sender).toBe('Viewer');
    expect(message.channel).toBe('somechannel');
  });

  test('omits isAction for a plain message and sets it for a /me', () => {
    const plain = createOptimisticMessage({
      badges: [],
      channelName: 'somechannel',
      isAction: false,
      messageText: 'hello',
      sentAt: SENT_AT,
      user,
      userstate,
    });
    const action = createOptimisticMessage({
      badges: [],
      channelName: 'somechannel',
      isAction: true,
      messageText: 'waves',
      sentAt: SENT_AT,
      user,
      userstate,
    });

    expect(plain.isAction).toBeUndefined();
    expect(action.isAction).toBe(true);
  });

  test('mirrors the reply target onto the row', () => {
    const message = createOptimisticMessage({
      badges: [],
      channelName: 'somechannel',
      isAction: false,
      messageText: '@Parent hi',
      replyTo: {
        color: '#9146ff',
        messageId: 'parent-1',
        message: 'parent body',
        username: 'Parent',
        replyParentUserLogin: 'parent',
      },
      sentAt: SENT_AT,
      user,
      userstate,
    });

    expect(message.parentDisplayName).toBe('Parent');
    expect(message.replyDisplayName).toBe('parent');
    expect(message.replyBody).toBe('parent body');
    expect(message.parentColor).toBe('#9146ff');
  });
});
