import type { NoticeTags } from '@app/types/chat/irc-tags/notice';

function extractFirstNumber(text: string): number | null {
  const match = text.match(/(\d+)/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1] ?? '', 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatNoticeMessage(
  tags: Partial<NoticeTags> | Record<string, string>,
  messageText: string,
): string | null {
  const noticeId = tags['msg-id'];
  const trimmed = messageText.trim();

  if (!noticeId) {
    return trimmed || null;
  }

  switch (noticeId) {
    case 'emote_only_off':
      return 'Emote-only mode disabled.';
    case 'emote_only_on':
      return 'Emote-only mode enabled.';
    case 'followers_off':
      return 'Followers-only mode disabled.';
    case 'followers_on':
      return trimmed || 'Followers-only mode enabled.';
    case 'followers_on_zero':
      return 'Followers-only mode enabled.';
    case 'msg_banned':
      return 'You are permanently banned from chatting in this channel.';
    case 'msg_bad_characters':
      return 'Your message contained unsupported characters.';
    case 'msg_channel_blocked':
      return 'Your account is not allowed to chat in this channel right now.';
    case 'msg_channel_suspended':
      return 'This channel is unavailable or suspended.';
    case 'msg_duplicate':
      return 'Duplicate message blocked.';
    case 'msg_emoteonly':
      return 'Emote-only mode is enabled.';
    case 'msg_followersonly':
    case 'msg_followersonly_zero':
      return 'Followers-only mode is enabled. Follow to chat.';
    case 'msg_followersonly_followed':
      return 'Followers-only mode is enabled. Keep following before you can chat.';
    case 'msg_r9k':
      return 'Unique-chat blocked your message.';
    case 'msg_ratelimit':
      return 'You are sending messages too quickly.';
    case 'msg_rejected':
      return 'AutoMod held your message for review.';
    case 'msg_rejected_mandatory':
      return "Your message was blocked by the channel's moderation settings.";
    case 'msg_requires_verified_phone_number':
      return 'Verify your phone number to chat in this channel.';
    case 'msg_slowmode': {
      const seconds = extractFirstNumber(trimmed);
      return seconds !== null
        ? `Slow mode is enabled (${seconds}s remaining).`
        : 'Slow mode is enabled. Wait before sending another message.';
    }
    case 'msg_subsonly':
      return 'Subscribers-only mode is enabled.';
    case 'msg_suspended':
      return "You don't have permission to perform that action.";
    case 'msg_timedout': {
      const seconds = extractFirstNumber(trimmed);
      return seconds !== null
        ? `You are timed out (${seconds}s remaining).`
        : 'You are timed out and cannot chat right now.';
    }
    case 'msg_verified_email':
      return 'Verify your account to chat in this channel.';
    case 'slow_off':
      return 'Slow mode disabled.';
    case 'slow_on': {
      const seconds = extractFirstNumber(trimmed);
      return seconds !== null
        ? `Slow mode enabled (${seconds}s).`
        : 'Slow mode enabled.';
    }
    case 'subs_off':
      return 'Subscribers-only mode disabled.';
    case 'subs_on':
      return 'Subscribers-only mode enabled.';
    case 'tos_ban':
      return (
        trimmed ||
        'This channel has been closed for Terms of Service violations.'
      );
    case 'unrecognized_cmd':
      return trimmed || 'Unrecognized command.';
    default:
      return trimmed || null;
  }
}
