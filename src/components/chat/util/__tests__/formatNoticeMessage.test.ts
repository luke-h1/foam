import { formatNoticeMessage } from '@app/components/chat/util/formatNoticeMessage';

describe('formatNoticeMessage', () => {
  test.each([
    [
      'msg_banned',
      'You are permanently banned from talking in channel.',
      'You are permanently banned from this channel.',
    ],
    [
      'msg_bad_characters',
      'Your message was not sent because it contained too many unprocessable characters.',
      'Your message contained unsupported characters.',
    ],
    [
      'msg_channel_blocked',
      'Your message was not sent because your account is not in good standing in this channel.',
      'Your account cannot chat in this channel right now.',
    ],
    [
      'msg_channel_suspended',
      'This channel does not exist or has been suspended.',
      'This channel is unavailable or suspended.',
    ],
    [
      'msg_duplicate',
      'Your message was not sent because it is identical to the previous one you sent, less than 30 seconds ago.',
      'Duplicate message blocked.',
    ],
    [
      'msg_emoteonly',
      'This room is in emote-only mode.',
      'Emote-only mode is enabled.',
    ],
    [
      'msg_followersonly',
      'This room is in 10 minute followers-only mode. Follow channel to join the community!',
      'Followers-only mode is enabled. Follow to chat.',
    ],
    [
      'msg_followersonly_followed',
      'This room is in 10 minute followers-only mode. You have been following for 5 minutes. Continue following to chat!',
      'Followers-only mode is enabled. Keep following to chat.',
    ],
    [
      'msg_followersonly_zero',
      'This room is in followers-only mode. Follow channel to join the community!',
      'Followers-only mode is enabled. Follow to chat.',
    ],
    [
      'msg_r9k',
      'This room is in unique-chat mode and the message you attempted to send is not unique.',
      'Unique-chat blocked your message.',
    ],
    [
      'msg_ratelimit',
      'Your message was not sent because you are sending messages too quickly.',
      'You are sending messages too quickly.',
    ],
    [
      'msg_rejected',
      'Hey! Your message is being checked by mods and has not been sent.',
      'AutoMod held your message for review.',
    ],
    [
      'msg_rejected_mandatory',
      'Your message wasn’t posted due to conflicts with the channel’s moderation settings.',
      "The channel's moderation settings blocked your message.",
    ],
    [
      'msg_requires_verified_phone_number',
      'A verified phone number is required to chat in this channel. Please visit https://www.twitch.tv/settings/security to verify your phone number.',
      'Verify your phone number to chat in this channel.',
    ],
    [
      'msg_slowmode',
      'This room is in slow mode and you are sending messages too quickly. You will be able to talk again in 3 seconds.',
      'Slow mode is enabled (3s remaining).',
    ],
    [
      'msg_slowmode',
      'This room is in slow mode.',
      'Slow mode is enabled. Wait before sending another message.',
    ],
    [
      'msg_subsonly',
      'This room is in subscribers only mode.',
      'Subscribers-only mode is enabled.',
    ],
    [
      'msg_suspended',
      'You don’t have permission to perform that action.',
      "You don't have permission to do that.",
    ],
    [
      'msg_timedout',
      'You are timed out for 587 more seconds.',
      'You are timed out (587s remaining).',
    ],
    ['msg_timedout', 'You are timed out.', 'You are timed out.'],
    [
      'msg_verified_email',
      'This room requires a verified account to chat.',
      'Verify your account to chat in this channel.',
    ],
    [
      'tos_ban',
      'The community has closed channel test due to Terms of Service violations.',
      'The community has closed channel test due to Terms of Service violations.',
    ],
    [
      'tos_ban',
      '  ',
      'This channel is closed for Terms of Service violations.',
    ],
    [
      'unrecognized_cmd',
      'Unrecognized command: /foo',
      'Unrecognized command: /foo',
    ],
    ['unrecognized_cmd', '', 'Unrecognized command.'],
    [
      'unknown_notice',
      '  Something unusual happened. ',
      'Something unusual happened.',
    ],
    ['unknown_notice', '   ', null],
  ])('msg-id %s with "%s" reads as %p', (msgId, text, expected) => {
    expect(formatNoticeMessage({ 'msg-id': msgId }, text)).toBe(expected);
  });

  test('returns the trimmed text when the notice has no msg-id', () => {
    expect(formatNoticeMessage({}, ' Welcome. ')).toBe('Welcome.');
  });
});
