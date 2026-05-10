import { formatNoticeMessage } from '../formatNoticeMessage';

describe('formatNoticeMessage', () => {
  test('formats emote-only off notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'emote_only_off' },
        'This room is no longer in emote-only mode.',
      ),
    ).toBe('Emote-only mode disabled.');
  });

  test('formats emote-only on notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'emote_only_on' },
        'This room is now in emote-only mode.',
      ),
    ).toBe('Emote-only mode enabled.');
  });

  test('formats followers-only off notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'followers_off' },
        'This room is no longer in followers-only mode.',
      ),
    ).toBe('Followers-only mode disabled.');
  });

  test('formats followers-only on notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'followers_on' },
        'This room is now in 10 minute followers-only mode.',
      ),
    ).toBe('This room is now in 10 minute followers-only mode.');
  });

  test('formats followers-only zero notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'followers_on_zero' },
        'This room is now in followers-only mode.',
      ),
    ).toBe('Followers-only mode enabled.');
  });

  test('formats banned notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_banned' },
        'You are permanently banned from talking in channel.',
      ),
    ).toBe('You are permanently banned from chatting in this channel.');
  });

  test('formats bad character notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_bad_characters' },
        'Your message was not sent because it contained too many unprocessable characters.',
      ),
    ).toBe('Your message contained unsupported characters.');
  });

  test('formats blocked account notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_channel_blocked' },
        'Your message was not sent because your account is not in good standing in this channel.',
      ),
    ).toBe('Your account is not allowed to chat in this channel right now.');
  });

  test('formats suspended channel notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_channel_suspended' },
        'This channel does not exist or has been suspended.',
      ),
    ).toBe('This channel is unavailable or suspended.');
  });

  test('formats duplicate message notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_duplicate' },
        'Your message was not sent because it is identical to the previous one you sent, less than 30 seconds ago.',
      ),
    ).toBe('Duplicate message blocked.');
  });

  test('formats emote-only kickbacks', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_emoteonly' },
        'This room is in emote-only mode.',
      ),
    ).toBe('Emote-only mode is enabled.');
  });

  test('formats followers-only kickbacks', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_followersonly' },
        'This room is in 10 minute followers-only mode. Follow channel to join the community!',
      ),
    ).toBe('Followers-only mode is enabled. Follow to chat.');
  });

  test('formats followers-only followed kickbacks', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_followersonly_followed' },
        'This room is in 10 minute followers-only mode. You have been following for 5 minutes. Continue following to chat!',
      ),
    ).toBe(
      'Followers-only mode is enabled. Keep following before you can chat.',
    );
  });

  test('formats followers-only zero kickbacks', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_followersonly_zero' },
        'This room is in followers-only mode. Follow channel to join the community!',
      ),
    ).toBe('Followers-only mode is enabled. Follow to chat.');
  });

  test('formats unique-chat kickbacks', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_r9k' },
        'This room is in unique-chat mode and the message you attempted to send is not unique.',
      ),
    ).toBe('Unique-chat blocked your message.');
  });

  test('formats ratelimit notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_ratelimit' },
        'Your message was not sent because you are sending messages too quickly.',
      ),
    ).toBe('You are sending messages too quickly.');
  });

  test('formats automod held messages', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_rejected' },
        'Hey! Your message is being checked by mods and has not been sent.',
      ),
    ).toBe('AutoMod held your message for review.');
  });

  test('formats moderation setting rejections', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_rejected_mandatory' },
        'Your message wasn’t posted due to conflicts with the channel’s moderation settings.',
      ),
    ).toBe("Your message was blocked by the channel's moderation settings.");
  });

  test('formats verified phone notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_requires_verified_phone_number' },
        'A verified phone number is required to chat in this channel. Please visit https://www.twitch.tv/settings/security to verify your phone number.',
      ),
    ).toBe('Verify your phone number to chat in this channel.');
  });

  test('formats slow mode notices with remaining seconds', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_slowmode' },
        'This room is in slow mode and you are sending messages too quickly. You will be able to talk again in 3 seconds.',
      ),
    ).toBe('Slow mode is enabled (3s remaining).');
  });

  test('formats subscribers-only kickbacks', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_subsonly' },
        'This room is in subscribers only mode.',
      ),
    ).toBe('Subscribers-only mode is enabled.');
  });

  test('formats suspended action notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_suspended' },
        'You don’t have permission to perform that action.',
      ),
    ).toBe("You don't have permission to perform that action.");
  });

  test('formats timeout notices with remaining seconds', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_timedout' },
        'You are timed out for 587 more seconds.',
      ),
    ).toBe('You are timed out (587s remaining).');
  });

  test('formats verified email notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'msg_verified_email' },
        'This room requires a verified account to chat.',
      ),
    ).toBe('Verify your account to chat in this channel.');
  });

  test('formats slow off notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'slow_off' },
        'This room is no longer in slow mode.',
      ),
    ).toBe('Slow mode disabled.');
  });

  test('formats slow on notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'slow_on' },
        'This room is now in slow mode. You may send messages every 15 seconds.',
      ),
    ).toBe('Slow mode enabled (15s).');
  });

  test('formats subscribers-only off notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'subs_off' },
        'This room is no longer in subscribers-only mode.',
      ),
    ).toBe('Subscribers-only mode disabled.');
  });

  test('formats subscribers-only on notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'subs_on' },
        'This room is now in subscribers-only mode.',
      ),
    ).toBe('Subscribers-only mode enabled.');
  });

  test('formats tos ban notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'tos_ban' },
        'The community has closed channel test due to Terms of Service violations.',
      ),
    ).toBe(
      'The community has closed channel test due to Terms of Service violations.',
    );
  });

  test('formats unrecognized command notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'unrecognized_cmd' },
        'Unrecognized command: /foo',
      ),
    ).toBe('Unrecognized command: /foo');
  });

  test('falls back to the raw message for unknown notices', () => {
    expect(
      formatNoticeMessage(
        { 'msg-id': 'unknown_notice' },
        'Something unusual happened.',
      ),
    ).toBe('Something unusual happened.');
  });

  test('returns null for empty unknown notices', () => {
    expect(
      formatNoticeMessage({ 'msg-id': 'unknown_notice' }, '   '),
    ).toBeNull();
  });
});
