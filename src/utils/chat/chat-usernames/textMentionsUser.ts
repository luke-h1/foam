import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { matchMentionLogin } from '@app/utils/chat/chat-usernames/twitchLogin';

export function textMentionsUser(
  text: string,
  normalisedUser: string,
): boolean {
  if (!normalisedUser || !text.includes('@')) {
    return false;
  }

  return text
    .split(/\s+/)
    .some(
      word =>
        normaliseChatUsername(matchMentionLogin(word)?.login) ===
        normalisedUser,
    );
}
